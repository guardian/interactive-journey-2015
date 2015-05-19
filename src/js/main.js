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
    'text!data/pageData.txt',
    'libs/archieml'
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
    pageDataText
) {
    'use strict';
    Ractive.DEBUG = false;
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
                        headerBlock: headerBlockHTML
                    },
                    data: {
                        pageBlocks: archieData.blocks
                    }
                });
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
