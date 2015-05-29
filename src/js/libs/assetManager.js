define([], function () {

	'use strict';
	
	var loadingQueue = [];
	var totalLoading = 0;
	var loadingMax = 4;
	var scrollTop;
	var windowHeight;
	var windowWidth;
	var imgSizes = {};
	var DEFAULT_BITRATE = '488k';
	var videoBitRate = DEFAULT_BITRATE;


	var updateScreen = function(top, height, width){
		scrollTop = top;
		windowHeight = height;
		windowWidth = width;
		lazyLoad();
//		autoPlay();
	};
	
	function addMedia(node, options) {
		if (options.type === 'image') { addPhoto(node, options); }
		if (options.type === 'video') { addVideo(node, options); }
	}

	var addPhoto = function ( node, options) {

			//creates reference to image to be loaded
			var el = {
				type: 'image',
				src: options.src.replace('https://', '').replace('http://', '').replace(/\/$/, ''),
				alt_src: (options.alt_src) ? alt_src.replace('https://', '').replace('http://', '').replace(/\/$/, ''): undefined,
				node: node,
				size: options.imgSizes,
				bgImg: (options.bgImg)? true : false
			};

			//pushes images to the list
			loadingQueue.unshift(el);

	};
	
	function addVideo(node, options) {
		var el = {
			type: 'video',
			src: options.src,
			node: node
		};
		loadingQueue.unshift(el);
	}

	var lazyLoad = function(){

		var i = loadingQueue.length;
		while( i -- ){
			if(loadingQueue[i].node.offsetTop <= scrollTop + windowHeight*2.5 ){
				if (loadingQueue[i].type === 'image') {
					fetchPhoto(loadingQueue[i]);
				}
				
				if (loadingQueue[i].type === 'video') {
					fetchVideo(loadingQueue[i]);
				}
				
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
			var nodeHeight = node.el.getBoundingClientRect().height;
			
			if ((node.el.offsetTop - scrollTop) <  windowHeight / 5  &&
				(node.el.offsetTop + nodeHeight) - scrollTop > 0 )
			{
				return node.el.play();		 
			}
			 
			if (node.el.paused === false) {
				 node.el.pause();
				 // Hacky delay to differentiate user pause vs. scroll pause 
				 setTimeout(function() { isGlobalPaused = false; }, 100);
			 }
		});	
	}
	
	var videoCDNBasePath = 'http://cdn.theguardian.tv/interactive/2015/05/28/';
	
	function getMP4URL(filename) {
		var fileSuffix = '_488k_H264.mp4';
		if (videoBitRate === '4M')   { fileSuffix = '_4M_H264.mp4'; }
		if (videoBitRate === '2M')   { fileSuffix = '_2M_H264.mp4'; }
		if (videoBitRate === '768k') { fileSuffix = '_768k_H264.mp4'; }
		if (videoBitRate === '488k') { fileSuffix = '_488k_H264.mp4'; }
		if (videoBitRate === '220k') { fileSuffix = '_220k_H264.mp4'; }
		return videoCDNBasePath + filename + fileSuffix;
	}
	
	function getWebmURL(filename) {
		var fileSuffix = '_488k_H264.mp4';
		if (videoBitRate === '4M')   { fileSuffix = '_4M_vp8.webm'; }
		if (videoBitRate === '2M')   { fileSuffix = '_2M_vp8.webm'; }
		if (videoBitRate === '768k') { fileSuffix = '_768k_vp8.webm'; }
		if (videoBitRate === '488k') { fileSuffix = '_488k_vp8.webm'; }
		if (videoBitRate === '220k') { fileSuffix = '_220k_vp8.webm'; }
		return videoCDNBasePath + filename + fileSuffix;
	}
	
	function getOggURL(filename) {
		var fileSuffix = '_mid.ogv';
		if (videoBitRate === '4M')   { fileSuffix = '_xhi.ogv'; }
		if (videoBitRate === '2M')   { fileSuffix = '_hi.ogv'; }
		if (videoBitRate === '768k') { fileSuffix = '_mid.ogv'; }
		if (videoBitRate === '488k') { fileSuffix = '_tiny.ogv'; }
		if (videoBitRate === '220k') { fileSuffix = '_lo.ogv'; }
		
		// Only _mid.ogv is working  so force that :(
		fileSuffix = '_mid.ogv';
		
		
		return 'http://cdn.theguardian.tv/interactive/mp4/1080/2015/05/28/' + filename + fileSuffix;
	}

	
	/**
	 * Get different video encoded paths.
	 * @param {string} baseURL - Path to the video on the GU CDN.
	 * @param {number} [bitrate=1024] - Video bitrate to use.  
	 * @returns {object} URLs to video files.
	 */
	function getVideoURLS(filename) {		
		return {
			'video/mp4': getMP4URL(filename),
			'video/webm': getWebmURL(filename),
			'video/ogg': getOggURL(filename),
			'video/m3u8': 'http://multimedia.guardianapis.com/interactivevideos/video.php?file=' + filename + '&format=application/x-mpegURL&maxbitrate=2000'	
		};
	}
	
	/**
	 * Get different video poster image.
	 * @param {string} baseURL - Path to the video on the GU CDN.
	 * @param {number} [bitrate=1024] - Video bitrate to use.  
	 * @returns {string} URL to video poster image.
	 */
	function getVideoPosterImage(filename) {
		return videoCDNBasePath + filename + '_' + videoBitRate + '_H264_poster.jpg';
	}
	
	
	function setVideoBitrate(bitrate) {
		var kbps = bitrate / 1024;
		if (kbps >= 4068) { videoBitRate = '4M'; }
		if (kbps < 4068) { videoBitRate  = '2M'; }
		if (kbps < 2048) { videoBitRate  = '768k'; }
		if (kbps < 1024) { videoBitRate  = '488k'; }
		if (kbps < 512)  { videoBitRate  = '220k'; }
	}
	
	
	function setupVideo(el, options) {
		mediaColltion.push({ el: el, src: options.src });

//		el.addEventListener('pause', function(evt) {
//			isGlobalPaused = true; 
//		}, false);
	}
	
	function fetchVideo(item) {	
		var filename = item.src.match(/=(.+)/);
		if (!filename) { return; }
		filename = filename[1];
		
		var videoURLs = getVideoURLS(filename);
		Object.keys(videoURLs).forEach(function(key) {
			var sourceEl = document.createElement('source');
			sourceEl.setAttribute('type', key);
			sourceEl.setAttribute('src', videoURLs[key]);
			item.node.appendChild(sourceEl);
		});
		
		var posterImage = getVideoPosterImage(filename);
		item.node.setAttribute('poster', posterImage);
} 


	var fetchPhoto = function(item){
		var image = new Image();

		var imgSize;

		if (!item.size) {
			imgSize = imgSizes['horizontal'][0];
		} else if(windowWidth < 640){
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
	};

	var setImageSizes = function(sizes){
		for(var key in sizes){
			var a = sizes[key].split(',');
            a.forEach(function(d,i){
                a[i] = Number(d);
            });
        	imgSizes[key] = a;
		}
	};


	return {
			updateScreen: updateScreen,
			addMedia: addMedia,
			setupVideo: setupVideo,
			setVideoBitrate: setVideoBitrate,
			setImageSizes: setImageSizes
	};

});
