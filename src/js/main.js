/*global archieml */
define([
    'reqwest',
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
    'text!data/pageData.txt',
    'libs/archieml',
    'ractive-touch'
], function(
    reqwest,
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
    pageDataText
) {
    'use strict';
    //Ractive.DEBUG = false;
    var base;

    function launchApp(el, archieData){
        console.log(archieData.blocks);
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
                        mapBlock: mapBlockHTML
                    },
                    data: {
                        pageBlocks: archieData.blocks,
                        scrollTop: 0,
                        windowHeight: window.innerHeight
                    }
                });

        window.addEventListener('scroll', debounce(function() {
            //throttle the scroll handler
            var top = (window.pageYOffset || document.documentElement.scrollTop);
            base.set('scrollTop', (top) ? top: 0);

        }, 100));
    }

    function logResponse(resp) {
        console.log(resp);
    }

    function handleRequestError(err, msg) {
        console.error('Failed: ', err, msg);
    }

    function afterRequest(resp) {
        console.log('Finished', resp);
    }

    //standard debounce function as taken from underscore
    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    function init(el, context, config, mediator) {       
        // DEBUG: What we get given on boot
        console.log(el, context, config, mediator);

        // Load local archieml data and pass data to ractive templating
        var pageBlocks = archieml.load(pageDataText);
        launchApp(el,pageBlocks);

        // Load remote JSON data
        var key = '1hy65wVx-pjwjSt2ZK7y4pRDlX9wMXFQbwKN0v3XgtXM';
        var url = 'http://interactive.guim.co.uk/spreadsheetdata/'+key+'.json';


        reqwest({
            url: url,
            type: 'json',
            crossOrigin: true
        })
        .then(logResponse)
        .fail(handleRequestError)
        .always(afterRequest);
    }

    return {
        init: init
    };
});
