define([], function () {

	'use strict';
	
	var loadingQueue = [];
	var totalLoading = 0;
	var loadingMax = 4;
	var scrollTop;
	var windowHeight;
	


	var updateScreen = function(top, height){
		scrollTop = top;
		windowHeight = height;
		lazyLoad();
		autoPlay();
	}

	var addPhoto = function ( node, src, imgSizes ) {

			//creates reference to image to be loaded
			var el = {
				src: src.replace('https://', '').replace('http://', '').replace(/\/$/, ''),
				node: node,
				imgSizes: imgSizes
			};
			//pushes images to the list
			loadingQueue.unshift(el);

	}

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
		
	}
	
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

		// var imgSize;
		// if(windowWidth < 640){
		// 	//load smallest image to fit small screen
		// 	imgSize = item.imgSizes[0];
		// } else if( windowWidth < 760 ) {
		// 	//load medium image to fit vertical iPad layout 
		// 	imgSize = item.imgSizes[1];
		// } else {
		// 	//load determine image to load by size of position for desktop layout
		// 	var elWidth = item.node.offsetWidth;
		// 	if(elWidth <= item.imgSizes[0]){
		// 		imgSize = item.imgSizes[0];
		// 	} else if(elWidth <= item.imgSizes[1] ){
		// 		imgSize = item.imgSizes[1];
		// 	} else {
		// 		imgSize = item.imgSizes[2];
		// 	}
		// };
		var path = "http://" + item.src; //'http://' + item.src + '/' + imgSize + '.jpg';
		image.onload = function() {
            item.node.setAttribute("src", path);
		};

		image.onerror = function(err) {

		};	

		//load image
		image.src = path;
	}






	return {
			updateScreen: updateScreen,
			addPhoto: addPhoto,
			setupAutoPlay: setupAutoPlay
	};

});
