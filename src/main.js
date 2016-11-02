;(function(factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(jQuery, document, window, undefined);
    } else {
        factory(jQuery, document, window, undefined);
    }
})(function($, document, window, undefined) {

    var Keyboard = (function() {
        function Keyboard() {

        }
        var keyMap = {
            esc: 27,
            '←': 37,
            '→': 39,
        }
        Keyboard.bind = function(key, handler) {
            $(document).on('keydown.dc' + key, function(event) {
                if (keyMap[key] === event.keyCode) {
                    event.preventDefault();
                    handler();
                }
            });
        }
        Keyboard.unbind = function(keys) {
            var keyArray = [].slice.call(arguments);
            for (var i = 0; i < keyArray.length; i++) {
                $(document).off('keydown.dc' + keyArray[i]);
            }
        }
        return Keyboard;
    })();
    var Photo = (function() {
        function Photo(data, photoDom, photoContainerDom, parent) {
            this.zoomRatio = 1;
            this.url = data.src;
            this.title = data.title;
            this.dom = photoDom;
            this.container = photoContainerDom;
            this.offsetX = 0;
            this.offsetY = 0;
            this.isMouseDown = false;
            this.inited = false;
            this.zoomInBtn = parent.zoomInBtn;
            this.zoomOutBtn = parent.zoomOutBtn;
            this.initZoomRatio = 1;
            this.maxZoomRatio = this.initZoomRatio * 10;
            this.minZoomRatio = this.initZoomRatio * 0.1;
            this.canDragShowed = false;
            this.photoGallery = parent;
            this.initialWidth = 0;
            this.initailHeight = 0;
            this.preloadImage = null;
        }
        Photo.step = 0.5;
        Photo.stepMultiply = 1.4;

        Photo.prototype.zoomIn = function() {
           
           
            if (this.zoomRatio >= this.maxZoomRatio) {
                return;
            }
            var oldZoomRatio = this.zoomRatio;

            // this.zoomRatio += Photo.step;
            this.zoomRatio *= Photo.stepMultiply;
           
            this.trigger('zoomChanged', this.zoomRatio, oldZoomRatio);
        };

        Photo.prototype.zoomOut = function() {
            if (this.zoomRatio <= this.minZoomRatio) {
                return;
            }
            var oldZoomRatio = this.zoomRatio;

            // this.zoomRatio -= Photo.step;
            this.zoomRatio /= Photo.stepMultiply;
            this.trigger('zoomChanged', this.zoomRatio, oldZoomRatio);
        };
        Photo.prototype.download = function(event) {
            // window.open(this.url);
            // window.location = this.url;

            // for ie and safari
            var a = document.createElement('a');
            if (typeof a.download === "undefined") {
                console.log('not support download attribute');
                // event.preventDefault();
                // window.open(this.url);
            }
        };
        Photo.prototype.trigger = function(event, newVal, oldVal) {
            this.container.trigger(event, {newVal: newVal, oldVal: oldVal});
        };
        Photo.prototype.init = function() {
            var self = this;

            if (this.inited) {
                this.zoomRatio = 1;
            }
            this.offsetX = 0;
            this.offsetY = 0;

            this.inited = true;

            this.dom.css({visibility: 'hidden'});
            this.changeSrc();

            this.dom.one('load', function() {
                self.draw();
                self.dom.css({visibility: 'visible'});
            });

        };

        Photo.prototype.preload = function() {
            if (!this.preloadImage) {
                this.preloadImage = new Image();
            }
            this.preloadImage.src = this.url;
        }
        Photo.prototype.destroy = function() {
            // destroy
        };

        Photo.prototype.changeSrc = function() {
            this.dom.attr('src', this.url);
            this.photoGallery.dom.find('.download a').attr('href', this.url);
        };
        Photo.prototype.draw = function() {

            this.initSize();
            this.initStyle();
            this.initBind();

            this.trigger('zoomChanged', this.initZoomRatio, this.initZoomRatio);

        };
        Photo.prototype.initSize = function() {
            var width = this.dom[0].naturalWidth;
            var height = this.dom[0].naturalHeight;
            var containerWidth = this.container.width();
            var containerHeight = this.container.height();
            // 如果图片的比较扁，优先宽度塞满
            if (height / width  < containerHeight / containerWidth) {
                var ratio = this.dom.width() / width;
                this.initialWidth = containerWidth;
                this.initialHeight = ratio * height;
                this.dom.width(this.initialWidth);
                this.dom.height(this.initialHeight);
            }

            // 如果图片比较瘦，优先高度塞满
            else {
                var ratio = this.dom.height() / height;

                this.initialWidth = ratio * width;
                this.initialHeight = containerHeight;

                this.dom.width(this.initialWidth);
                this.dom.height(this.initialHeight);
            }

        }
        Photo.prototype.initStyle = function() {
            this.container.css({
                position: 'relative',
                overflow: 'hidden',
            });
            this.dom.css({
                position: 'absolute',
                left: 0,
                top: 0
            });

            // 定位置
            this.makePosition();
        };

        Photo.prototype.makePosition = function() {
           
            var zoomRatio = this.zoomRatio;
           
            // dom.width()是不计算transform的倍率的。
            var width = this.dom.width();
            var height = this.dom.height();

            var containerWidth = this.container.width();
            var containerHeight = this.container.height();
            var limitWidth = 0.5 * (-containerWidth + width * zoomRatio);
            var limitHeight = 0.5 * (-containerHeight + height * zoomRatio);

            function makePositionByOffSet(inner, outer, offset) {
                // 这个函数是不管offset的合理性的
                if (!inner.width && !inner.height) {
                    return;
                }
                if (!outer.width && !outer.height) {
                    return;
                }
                if (offset.x === undefined || offset.y === undefined) {
                    return;
                }
                var left,top;

                left = (outer.width - inner.width) / 2 + offset.x;
                top = (outer.height - inner.height) / 2 + offset.y;

                return {
                    left: left,
                    top: top
                }
            }

            // 不能超过container的边界
            function sgn(x, y) {
                //
                y = Math.abs(y);
                if (x < -y) {
                    return -y;
                } else if (-y <= x && x <= y) {
                    return x;
                } else {
                    return y;
                }
            }

            // 不再限制外框
            // this.offsetX = sgn(this.offsetX, limitWidth);
            // this.offsetY = sgn(this.offsetY, limitHeight);


            // 注意无论scale多少，绝对定位时还是以原始大小来定的！
            var style = makePositionByOffSet({
                width: width, // 这里不乘zoomRatio！
                height: height
            }, {
                width: containerWidth,
                height: containerHeight
            }, {
                x: this.offsetX,
                y: this.offsetY
            });


            // 需要dom是绝对定位
            this.dom.css({
                left: style.left,
                top: style.top
            });
        };

        Photo.prototype.initBind = function() {
            // 鼠标位置
            var x, y;

            this.dom.off('mousedown.dcPan').on('mousedown.dcPan', function(event) {
                // 什么都不做
                if (event.which !== 1) {
                    return;
                }
                x = event.pageX;
                y = event.pageY;

                this.isMouseDown = true;

                return false;
            }.bind(this));

            $(document).off('mouseup.dcPan').on('mouseup.dcPan', function(event) {

                this.isMouseDown = false;
                return false;
            }.bind(this));

            $(document).off('mousemove.dcPan').on('mousemove.dcPan', function(event) {
                // 如果不是点击时的鼠标移动，什么都不做
                // 或者当zoomRatio === 1的时候 什么都不做
                if (!this.isMouseDown) {
                    return;
                }
                if (this.zoomRatio === 1) {
                    return
                }

                var dx = event.pageX - x;
                var dy = event.pageY - y;

                this.offsetX += dx;
                this.offsetY += dy;

                this.makePosition(); 

                x = event.pageX
                y = event.pageY

                return false;
            }.bind(this));


            this.container.off('zoomChanged').on('zoomChanged', function(event, zoomRatio) {
                // 以下代码保证放大的是中心区域
                var xRatio =  this.offsetX / this.dom.width();
                var yRatio = this.offsetY / this.dom.height();
                
                console.log('zoomRatio', this.zoomRatio);
                this.dom.width(this.initialWidth * this.zoomRatio);
                this.dom.height(this.initialHeight * this.zoomRatio);

                var diffX = xRatio * this.dom.width() - this.offsetX;
                var diffY = yRatio * this.dom.height() - this.offsetY;

                this.offsetX += diffX;
                this.offsetY += diffY;

                // ends
                this.makePosition();

                this.dom.removeClass('panning'); 
                this.zoomInBtn.removeClass('disabled');
                this.zoomOutBtn.removeClass('disabled');

                if (this.zoomRatio > 1) {
                    this.dom.addClass('panning');
                    if (!this.canDragShowed) {
                        this.showCanDrag();
                    }
                }

                if (this.zoomRatio > this.maxZoomRatio) {
                    this.zoomInBtn.addClass('disabled'); 
                }

                if (this.zoomRatio <= this.minZoomRatio) {
                    this.zoomOutBtn.addClass('disabled');
                }
                if (this.zoomRatio === 1) {
                    this.resize();
                }
            }.bind(this));
        }
        Photo.prototype.resize = function() {
            this.offsetX = 0;
            this.offsetY = 0;
            this.initSize();
            this.initStyle();
        };
        Photo.prototype.showCanDrag = function() {
            var canDragLabel = this.photoGallery.dom.find('.dc-photo-can-drag-label');
            canDragLabel.removeClass('transparent');
            this.canDragShowed = true;
            setTimeout(function() {
                canDragLabel.addClass('transparent');
            }, 1000);
        };
        return Photo;
    })();

    var PhotoGallery = (function() {
        function PhotoGallery(dom, data, index) {
            if (!dom || dom.length === 0) {
                throw Error('没找到dom哦');
            }
            if (!data) {
                throw Error('你的数据呢');
            }
            if (index >= data.length || index <= -1) {
                throw Error('你index传错了亲');
            }
            this.dom = dom;
            this.data = data;
            this.photoContainerDom = this.dom.find('.container');
            this.photoDom = this.dom.find('.container img');
            this.leftBtn = this.dom.find('.leftArrowArea');
            this.rightBtn = this.dom.find('.rightArrowArea');
            this.closeBtn = this.dom.find('.close');
            this.zoomInBtn = this.dom.find('.zoomIn');
            this.zoomOutBtn = this.dom.find('.zoomOut');
            this.downloadBtn = this.dom.find('.download');
            this.indexDom = this.dom.find('.index');
            this.photoNameDom = this.dom.find('.photoName');
            this.index = index;
            this.photoLength = this.data.length;
            this.photos = [];
            this.currentPhoto = null;
            this.onClose = function(){};
            this.onOpen = function(){};

            // 第一次inited后设为true
            this.inited = false;

            this.previousPhoto = null;
            this.nextPhoto = null;
        }
        PhotoGallery.prototype.getIndex = function(type) {
            var result;
            if (type === 'next') {
                if (this.index !== this.photoLength -1) {
                    result = this.index + 1;
                } else {
                    result = 0;
                }
            }
            if (type === 'prev') {
                if (this.index !== 0) {
                    result = this.index - 1;
                } else {
                    result = this.photoLength -1;
                }
            }
            return result;  
        };
        PhotoGallery.prototype.init = function(setting) {

            if (this.inited) {
                console.error('already inited');
                return;
            }
            var setting = setting || {};

            if (setting.onClose) {
                this.onClose = setting.onClose;
            }
            if (setting.onOpen) {
                this.onOpen = setting.onOpen;
            }
            this.onOpen();
            this.show();
            this.initPhotos();
            this.bindClick();
            this.bindCustomEvent();
            this.bindWindowResize();
            this.bindKeyboardControll();
            this.draw();
            this.inited = true;

        };
        PhotoGallery.prototype.initPhotos = function() {
            for (var i = 0; i < this.photoLength; i++) {
                this.photos.push(new Photo(this.data[i], this.photoDom, this.photoContainerDom, this))
            }
            this.currentPhoto = this.photos[this.index];
            this.previousPhoto = this.photos[this.getIndex('prev')];
            this.nextPhoto = this.photos[this.getIndex('next')];
        };
        PhotoGallery.prototype.bindClick = function() {
            var self = this;
            this.closeBtn.off('click').on('click', function() {
                self.destroy();
            });
            this.leftBtn.off('click').on('click', function() {
                self.prev();
            });
            this.rightBtn.off('click').on('click', function() {
                self.next();
            });
            this.zoomInBtn.off('click').on('click', function() {
                self.currentPhoto.zoomIn();
            });
            this.zoomOutBtn.off('click').on('click', function() {
                self.currentPhoto.zoomOut();
            });
            this.downloadBtn.off('click').on('click', function(event) {
                self.currentPhoto.download(event);
            });
        };

        PhotoGallery.prototype.destroy = function() {
            for (var i = 0; i < this.photos.length; i++) {
                if (this.photos[i].inited) {
                    this.photos[i].destroy();
                }
            }
            this.unbindKeyboardControll();
            this.hide();


        };
        PhotoGallery.prototype.show = function() {
            this.dom.show();
            this.onOpen();
        };
        PhotoGallery.prototype.hide = function() {
            this.dom.hide();
            this.onClose();
        };
        PhotoGallery.prototype.next = function() {
            this.index = this.getIndex('next');
 
            this.currentPhoto = this.photos[this.index];
            this.previousPhoto = this.photos[this.getIndex('prev')];
            this.nextPhoto = this.photos[this.getIndex('next')];
            this.trigger('photoChanged');
        };
        PhotoGallery.prototype.prev = function() {
            this.index = this.getIndex('prev');
            this.currentPhoto = this.photos[this.index];
            this.previousPhoto = this.photos[this.getIndex('prev')];
            this.nextPhoto = this.photos[this.getIndex('next')];
            this.trigger('photoChanged');
        };
        PhotoGallery.prototype.drawPhoto = function() {
            this.currentPhoto.init();
            this.previousPhoto.preload();
            this.nextPhoto.preload();
        };
        PhotoGallery.prototype.trigger = function(eventName, arg) {
            this.dom.trigger(eventName, arg);
        };
        PhotoGallery.prototype.bindCustomEvent = function() {
            this.dom.off('photoChanged').on('photoChanged', function() {
                this.draw();
            }.bind(this));
            this.dom.off('windowResize').on('windowResize', function() {
                this.currentPhoto.resize();
            }.bind(this));  
        };
        PhotoGallery.prototype.bindWindowResize = function() {
            var timer;
            var self = this;
            $(window).off('resize').on('resize', function() {
                clearTimeout(timer);
                timer = setTimeout(function() {
                    self.trigger('windowResize');
                }, 40);
            });
        };
        PhotoGallery.prototype.bindKeyboardControll = function() {
            var self = this;
            Keyboard.bind('←', self.prev.bind(self));
            Keyboard.bind('→', self.next.bind(self));
            Keyboard.bind('esc', self.destroy.bind(self));
        };
        PhotoGallery.prototype.unbindKeyboardControll = function() {

            Keyboard.unbind('←', '→', 'esc');
        };
        PhotoGallery.prototype.drawText = function() {
            this.indexDom.html(this.index + 1 + '/' + this.photoLength);
            this.photoNameDom.html(this.currentPhoto.title);
        };
        PhotoGallery.prototype.draw = function() {
            this.drawText();
            this.drawPhoto();
        };

        return PhotoGallery;
    })();
    window.dcPhotoGallery = PhotoGallery;
    return PhotoGallery;
});
