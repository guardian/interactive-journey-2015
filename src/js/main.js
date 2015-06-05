define([
    'reqwest',
    'swiper',
    'ractive',
    'rvc!templates/appTemplate',
    'rvc!templates/imageBlockTemplate',
    'rvc!templates/copyBlockTemplate',
    'rvc!templates/leadBlockTemplate',
    'rvc!templates/pullBlockTemplate',
    'rvc!templates/galleryBlockTemplate',
    'rvc!templates/videoBlockTemplate',
    'rvc!templates/headerBlockTemplate',
    'rvc!templates/mapBlockTemplate',
    'rvc!templates/mapHeaderBlockTemplate',
    'rvc!templates/mapSeaBlockTemplate',
    'rvc!templates/audioBlockTemplate',
    'rvc!templates/audioPlayerTemplate',
    'rvc!templates/shareTemplate',
    'libs/assetManager',
    'libs/bandwidth',
    'viewport-units-buggyfill',
    'viewport-units-buggyfill.hacks'
], function(
    reqwest,
    swiper,
    Ractive,
    AppTemplate,
    imageBlockHTML,
    copyBlockHTML,
    leadBlockHTML,
    pullBlockHTML,
    galleryBlockHTML,
    videoBlockHTML,
    headerBlockHTML,
    mapBlockHTML,
    mapHeaderBlockHTML,
    mapSeaBlockHTML,
    audioBlockHTML,
    audioPlayer,
    shareTemplate,
    assetManager,
    bandwidth,
    viewportUnitsBuggyfill,
    viewportUnitsBuggyfillHacks
) {
    'use strict';
    //Ractive.DEBUG = false;
    var base;
    
    function cleanData(data) {
        data.blocks.forEach(function(block) {
            if (block.hasOwnProperty('copy')) {
                 block.copy = block.copy.replace(/[\r\n]+/g, '\n').split('\n');
            }
        });
        return data;
    }

    function launchApp(el, responseData){
        var archieData = cleanData(responseData);
                
        //initialize the ractive base, add data, and comonent modules
        base = new AppTemplate({
            el: el,
            components: {
                copyBlock: copyBlockHTML,
                imageBlock: imageBlockHTML,
                leadBlock: leadBlockHTML,
                pullBlock: pullBlockHTML,
                galleryBlock: galleryBlockHTML,
                videoBlock: videoBlockHTML,
                headerBlock: headerBlockHTML,
                mapBlock: mapBlockHTML,
                mapHeaderBlock: mapHeaderBlockHTML,
                mapSeaBlock: mapSeaBlockHTML,
                audioBlock: audioBlockHTML,
                audioPlayer: audioPlayer,
                shareTools: shareTemplate
            },
            data: {
                pageBlocks: archieData.blocks,
                config: archieData.config
            },
            decorators: {
                lazyload: function ( node, options ) {
                    assetManager.addMedia( node, options );

                    return {
                        teardown: function () {}
                    };
                },
                
            },
            oncomplete: function(){
                assetManager.setImageSizes(archieData.config.imageSizes);

                this.observe( 'scrollTop windowHeight', function(){
                    assetManager.updateScreen(
                        this.get('scrollTop'),
                        this.get('windowHeight'),
                        this.get('windowWidth')
                    );
                });

                this.set( measureScreen() );

                // Wait for content to be loaded before testing bandwidth
                setTimeout(function() {
                    bandwidth.getSpeed(assetManager.setVideoBitrate);
                }, 2000);

                window.addEventListener('scroll', debounce( function() {
                    base.set( measureScreen() );
                }, 100));

            }
        });
    }

    function measureScreen(){
        var top = (window.pageYOffset || document.documentElement.scrollTop);
        return {
            scrollTop: top,
            windowHeight: window.innerHeight,
            windowWidth: window.innerWidth
        };
    }

     function handleRequestError(err, msg) {
        console.error('Failed: ', err, msg);
    }

    //standard debounce function as taken from underscore
    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) { func.apply(context, args); }
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) { func.apply(context, args); }
        };
    }

    function init(el) {
        // Load remote JSON data
        var key = '1fELDqgjhldHT-uHWxtMKz4ZjiMLbzb9MwUV6lW8TjAo';
        var url = 'http://interactive.guim.co.uk/docsdata-test/'+key+'.json';


        reqwest({
            url: url,
            type: 'json',
            crossOrigin: true
        })
        .then(function(data){
            launchApp(el, data);
        })
        .fail(handleRequestError);

        // Fix iOS and ie9+ viewport units
        viewportUnitsBuggyfill.init({
            hacks: viewportUnitsBuggyfillHacks,
            refreshDebounceWait: 250
        });
    }

    return {
        init: init
    };
});
