/*global archieml */
define([
    'reqwest',
    'underscore',
    'json!data/sampleData.json',
    'text!templates/appTemplate.html',
    'text!templates/imageBlockTemplate.html',
    'text!templates/copyBlockTemplate.html',
    'text!templates/leadBlockTemplate.html',
    'text!data/pageData.txt',
    'libs/archieml'
], function(
    reqwest,
    _,
    sampleData,
    templateHTML,
    imageBlockHTML,
    copyBlockHTML,
    leadBlockHTML,
    pageDataText
) {
   'use strict';
   
   var ele;

    function logResponse(resp) {
        console.log(resp);
    }

    function handleRequestError(err, msg) {
        console.error('Failed: ', err, msg);
    }

    function afterRequest(resp) {
        console.log('Finished', resp);
    }
    
    function addBlock(blockData, templateHTML) {
        var compiled = _.template(templateHTML);
        var html = compiled(blockData);
        ele.innerHTML += html;
    }

    function init(el, context, config, mediator) {
        ele = el;
        
        // DEBUG: What we get given on boot
        console.log(el, context, config, mediator);

        // DOM template example
        el.innerHTML = templateHTML;

        // Load local archieml data
        var pageBlocks = archieml.load(pageDataText);
        pageBlocks.blocks.forEach(function(block) {
            console.log(block);
            switch (block.block) {
                case 'image':
                    addBlock(block, imageBlockHTML);
                    break;
                case 'copy':
                    addBlock(block, copyBlockHTML);
                    break;
                case 'lead':
                    addBlock(block, leadBlockHTML);
                    break;
                default: 
                    return;
            }
        });

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
