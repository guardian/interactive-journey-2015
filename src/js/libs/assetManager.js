define([], function () {

	'use strict';
	
	var loadingQueue = [];
	var scrollTop;
	var windowHeight;
	var windowWidth;
	var imgSizes = {};
	var DEFAULT_BITRATE = '488k';
	var videoBitRate = DEFAULT_BITRATE;


	var updateScreen = function(top, height, width){
        if (typeof top !== 'number' || typeof height !== 'number') {
            return;
        }
		scrollTop = top;
		windowHeight = height;
		windowWidth = width;
        loadingQueue.forEach(lazyLoad);
		autoPlay();
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

	function lazyLoad(item) {
        if (item.loaded) { return; }
            
        var topDist = item.node.getBoundingClientRect().top;
        if( topDist > scrollTop + windowHeight*2 ){
            return;
        }

        if (item.type === 'image') {
            fetchPhoto(item);
        }
        
        if (item.type === 'video') {
            fetchVideo(item);
        }
	}
	
	
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
	
    /**
     * Extract basepath and filename form a full video endpoint URL.
     * @param {string} videoURL - Full CDN path to video file.
     * @return {object} {basepath, filename}
     */
    function getVideoCDNBasePaths(videoURL) {
        var regex = /(?:interactive\/mp4\/1080|interactive)\/(.+)\/(.+)_.+_.+\..+$/g;
        var matches = regex.exec(videoURL);
        
        if (!matches) {
            console.warn('Failed to find video path and filename', videoURL);
            return;
        }


        var path = 'http://cdn.theguardian.tv/interactive/';
        var oggPath = path + 'mp4/1080/' + matches[1] + '/' + matches[2];

        path += matches[1] + '/' + matches[2];
        var poster = path + '_768k_H264_poster.jpg';

        return {
            path: path,
            oggPath: oggPath,
            folder: matches[1],
            filename: matches[2],
            poster: poster 
        };
    }

	
	function getMP4URL(path) {
		var fileSuffix = '_488k_H264.mp4';
		if (videoBitRate === '4M')   { fileSuffix = '_4M_H264.mp4'; }
		if (videoBitRate === '2M')   { fileSuffix = '_2M_H264.mp4'; }
		if (videoBitRate === '768k') { fileSuffix = '_768k_H264.mp4'; }
		if (videoBitRate === '488k') { fileSuffix = '_488k_H264.mp4'; }
		if (videoBitRate === '220k') { fileSuffix = '_220k_H264.mp4'; }
		return path + fileSuffix;
	}
	
	function getWebmURL(path) {
		var fileSuffix = '_488k_H264.mp4';
		if (videoBitRate === '4M')   { fileSuffix = '_4M_vp8.webm'; }
		if (videoBitRate === '2M')   { fileSuffix = '_2M_vp8.webm'; }
		if (videoBitRate === '768k') { fileSuffix = '_768k_vp8.webm'; }
		if (videoBitRate === '488k') { fileSuffix = '_488k_vp8.webm'; }
		if (videoBitRate === '220k') { fileSuffix = '_220k_vp8.webm'; }
		return path + fileSuffix;
	}
	
	function getOggURL(path) {
		var fileSuffix = '_mid.ogv';
		if (videoBitRate === '4M')   { fileSuffix = '_xhi.ogv'; }
		if (videoBitRate === '2M')   { fileSuffix = '_hi.ogv'; }
		if (videoBitRate === '768k') { fileSuffix = '_mid.ogv'; }
		if (videoBitRate === '488k') { fileSuffix = '_tiny.ogv'; }
		if (videoBitRate === '220k') { fileSuffix = '_lo.ogv'; }
		
		// Only _mid.ogv is working  so force that :(
		fileSuffix = '_mid.ogv';
		return path + fileSuffix;
	}

	
	/**
	 * Get different video encoded paths.
	 * @param {string} baseURL - Path to the video on the GU CDN.
	 * @param {number} [bitrate=1024] - Video bitrate to use.  
	 * @returns {object} URLs to video files.
	 */
	function getVideoURLS(filePath) {		
        var videoPaths = getVideoCDNBasePaths(filePath);

		return {
			'video/mp4': getMP4URL(videoPaths.path),
			'video/webm': getWebmURL(videoPaths.path),
			'video/ogg': getOggURL(videoPaths.oggPath),
			'video/m3u8': 'http://multimedia.guardianapis.com/interactivevideos/video.php?file='+
                videoPaths.filename + '&format=application/x-mpegURL&maxbitrate=2000'	
		};
	}
	
	/**
	 * Get video poster image URL.
	 * @param {string} filePath - Path to the video on the GU CDN.
	 * @returns {string} URL to video poster image.
	 */
	function getVideoPosterImage(filePath) {
        var videoPaths = getVideoCDNBasePaths(filePath);
		return videoPaths.poster; 
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
		el.addEventListener('pause', function() {
			isGlobalPaused = true; 
		}, false);
	}
	
	function fetchVideo(item) {	
        if (!item.src || item.src.match('=')) { 
            return console.warn('Skipping multimedia video.', item.src);
        }

        if (item.loaded) {
            console.load('Already loaded video', item);
            return;
        }

		var videoURLs = getVideoURLS(item.src);
        if (!videoURLs) { return; }
		Object.keys(videoURLs).forEach(function(key) {
			var sourceEl = document.createElement('source');
			sourceEl.setAttribute('type', key);
			sourceEl.setAttribute('src', videoURLs[key]);
			item.node.appendChild(sourceEl);
		});
		
		var posterImage = getVideoPosterImage(item.src);
		item.node.setAttribute('poster', posterImage);

        item.videosURLS = videoURLs;
        item.posterImg = posterImage;
        item.loaded = true;
    } 


	var fetchPhoto = function(item){
		var image = new Image();

		var imgSize;
		var path;


		if (!item.size || typeof item.size !== "string") {
			path = 'http://' + item.src;

		} else {

			if(windowWidth < 640){
				//load smallest image to fit small screen
				imgSize = imgSizes[item.size][0];
			
			} else if( windowWidth < 760 ) {
				//load medium image to fit vertical iPad layout 
				imgSize = imgSizes[item.size][1];
			} else {
				//load determine image to load by size of position for desktop layout
				var elWidth = item.node.parentNode.offsetWidth;
				if(elWidth <= imgSizes[item.size][0]){
					imgSize = imgSizes[item.size][0];
				} else if(elWidth <= imgSizes[item.size][1] ){
					imgSize = imgSizes[item.size][1];
				} else {
					imgSize = imgSizes[item.size][2];
				}
			}
			path = 'http://' + item.src + '/' + imgSize + '.jpg';
		} 
		console.log(path)

		image.onload = function() {
			if(item.bgImg){
				item.node.style.backgroundImage = "url(" + path + ")";
			} else {
				item.node.setAttribute("src", path);
			}
            
		};

		image.onerror = function() {
		};	

		//load image
		image.src = path;

        item.loaded = true;
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
