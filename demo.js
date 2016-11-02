$(function() {

    var dom = $('.dc-photo-gallery');
    var images = [
        {title: "羊驼1", src: "http://a.hiphotos.baidu.com/baike/pic/item/94cad1c8a786c9178760a6c7cb3d70cf3ac757e9.jpg"},
        {title: "羊驼2", src: "http://b.hiphotos.baidu.com/baike/pic/item/0df431adcbef7609fa966d612cdda3cc7dd99eab.jpg"},
        {title: "羊驼3", src: "http://d.hiphotos.baidu.com/baike/pic/item/810a19d8bc3eb135d85a4345a41ea8d3fc1f44ab.jpg"},
    ];
    var images2 = [
        {title: "海绵宝宝1", src: "http://img4.imgtn.bdimg.com/it/u=1226642092,3199450870&fm=21&gp=0.jpg"},
        {title: "海绵宝宝2", src: "http://g.hiphotos.baidu.com/zhidao/pic/item/503d269759ee3d6ddbf5109947166d224f4adeb5.jpg"}

    ];
    $("#open").click(function() {
        var photoGallery = new dcPhotoGallery(dom, images, 0);
        photoGallery.init();
    })

    $("#open2").click(function() {
        var photoGallery = new dcPhotoGallery(dom, images2, 0);
        photoGallery.init();
    })

})