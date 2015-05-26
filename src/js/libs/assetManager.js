define([], function () {

	'use strict';
	
	var loadingQueue = [];
	var totalLoading = 0;
	var loadingMax = 4;
	var scrollTop;
	var windowHeight;
	var windowWidth;
	var imgSizes = {};


	var updateScreen = function(top, height, width){
		scrollTop = top;
		windowHeight = height;
		windowWidth = width;
		lazyLoad();
		autoPlay();
		scrollChange();
	};

	var addPhoto = function ( node, options) {

			//creates reference to image to be loaded
			var el = {
				src: options.src.replace('https://', '').replace('http://', '').replace(/\/$/, ''),
				alt_src: (options.alt_src) ? alt_src.replace('https://', '').replace('http://', '').replace(/\/$/, ''): undefined,
				node: node,
				size: options.imgSizes,
				bgImg: (options.bgImg)? true : false
			};

			//pushes images to the list
			loadingQueue.unshift(el);

	};

	var lazyLoad = function(){

		var i = loadingQueue.length;
		while( i -- ){

			if(loadingQueue[i].node.offsetTop <= scrollTop + windowHeight*2.5 ){
				fetchPhoto(loadingQueue[i]);
				loadingQueue.pop();
			} else {
				i = 0;
			}
		}
		
	};
	
	var isGlobalPaused = false;
	var mediaColltion = [];
	
	function autoPlay() {
		if (isGlobalPaused) { return; }
		
		mediaColltion.forEach(function(node) {
			var nodeHeight = node.getBoundingClientRect().height;
			
			if ((node.offsetTop - scrollTop) <  windowHeight / 5  &&
				(node.offsetTop + nodeHeight) - scrollTop > 0 )
			{
				return node.play();		 
			}
			 
			if (node.paused === false) {
				 node.pause();
				 // Hacky delay to differentiate user pause vs. scroll pause 
				 setTimeout(function() { isGlobalPaused = false; }, 100);
			 }
		});	
	}
	
	function setupAutoPlay(el) {
		mediaColltion.push(el);
		el.addEventListener('pause', function(evt) {
			isGlobalPaused = true; 
		}, false);
	}
	


	var fetchPhoto = function(item){
		var image = new Image();

		var imgSize;
		if(windowWidth < 640){
			//load smallest image to fit small screen
			imgSize = imgSizes[item.size][0];
		} else if( windowWidth < 760 ) {
			//load medium image to fit vertical iPad layout 
			imgSize = imgSizes[item.size][1];
		} else {
			//load determine image to load by size of position for desktop layout
			var elWidth = item.node.offsetWidth;
			if(elWidth <= imgSizes[item.size][0]){
				imgSize = imgSizes[item.size][0];
			} else if(elWidth <= imgSizes[item.size][1] ){
				imgSize = imgSizes[item.size][1];
			} else {
				imgSize = imgSizes[item.size][2];
			}
		};

		var path = 'http://' + item.src + '/' + imgSize + '.jpg'; //"http://" + item.src; //
		image.onload = function() {
			if(item.bgImg){
				item.node.style.backgroundImage = "url(" + path + ")";
			} else {
				item.node.setAttribute("src", path);
			}
            
		};

		image.onerror = function(err) {

		};	

		//load image
		image.src = path;
	}

	var setImageSizes = function(sizes){
		for(var key in sizes){
			var a = sizes[key].split(',');
            a.forEach(function(d,i){
                a[i] = Number(d);
            })
        	imgSizes[key] = a;
		}
	}

	var scrollCollection = [];
	function scrollChange(node) {
		scrollCollection.forEach(function(node) {

			var nodeHeight = node.getBoundingClientRect().height;
			
			if ((node.offsetTop - scrollTop) <  windowHeight  &&
				(node.offsetTop + nodeHeight) - scrollTop > 0 )
			{
				
				var heightDiff = (node.offsetTop + nodeHeight) - scrollTop;
				var percent = 1 - (heightDiff / windowHeight);
				node.style.backgroundColor = 'rgba(255,0,0,' + percent + ')';
				return console.log(node, heightDiff, percent);	 
			}
		});	
	}
	
	function setupScrollChange(node) {
		scrollCollection.push(node);
		
	}




	return {
			updateScreen: updateScreen,
			addPhoto: addPhoto,
			setupAutoPlay: setupAutoPlay,
			setImageSizes: setImageSizes,
			setupScrollChange: setupScrollChange
	};

});
