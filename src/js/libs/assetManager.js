define([
	'isMobile',
	'libs/polyfills'
],
function (
	isMobile
) {
	'use strict';
	
	var loadingQueue = [];
	var isGlobalPaused = false;
	var scrollTop;
	var windowHeight;
	var windowWidth;
	var imgSizes = {};
	var DEFAULT_BITRATE = '488k';
	var videoBitRate = DEFAULT_BITRATE;
	
	function setGlobalPaused() {
		isGlobalPaused = true;
		document.querySelector('body').classList.add('gusto-global-pause');
	}
	
	function removeGlobalPaused() {
		isGlobalPaused = false;
		document.querySelector('body').classList.remove('gusto-global-pause');
	}

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
		if (!options.src) {
			console.warn('Skipping image with no src', options);
			return;
		}
		
		//creates reference to image to be loaded
		var el = {
			type: 'image',
			src: options.src.replace('https://', '').replace('http://', '').replace(/\/$/, ''),
			alt_src: (options.alt_src) ? alt_src.replace('https://', '').replace('http://', '').replace(/\/$/, ''): undefined,
			node: node,
			size: (options.imgSizes)? options.imgSizes : undefined,
			bgImg: (options.bgImg)? true : false
		};

		//pushes images to the list
		loadingQueue.unshift(el);
	};
	
	function toggleVideoPlay(vidEl, isScrollPause) {
		if (vidEl.paused) {
			if (_currentlyPlayingVideo && _currentlyPlayingVideo !== vidEl) {
				_currentlyPlayingVideo.pause();
				_currentlyPlayingVideo.parentNode.classList.remove('isPlaying');
			}
			vidEl.play();
			vidEl.parentNode.classList.add('isPlaying');
			removeGlobalPaused();
			_currentlyPlayingVideo = vidEl;
		} else {
			vidEl.pause();
			vidEl.parentNode.classList.remove('isPlaying');
            if (!isScrollPause) {
    			setGlobalPaused();
            }
			_currentlyPlayingVideo = null;
		}
	}
	
	function addVideo(node, options) {
		var el = {
			type: 'video',
			src: options.src,
			node: node,
			bgImg: (options.bgImg)? true : false
		};
		loadingQueue.unshift(el);
		
		// Add video controls
		node.addEventListener('click',function() {
			toggleVideoPlay(el.node);
		}, false);
		
		var coverEl = node.parentNode.querySelector('.gusto-video-cover');
		if (coverEl) {
			coverEl.addEventListener('click',function() {
				toggleVideoPlay(el.node);
			}, false);	
		}
	}
	

	function lazyLoad(item, index) {
		if (item.loaded) { return; }
        var topDist = item.node.getBoundingClientRect().top;
        var almostInView = (topDist < windowHeight * 2.5 );
        if (almostInView){
            if (item.type === 'image') {
                fetchPhoto(item, index);
            }
            if (item.type === 'video') {
                fetchVideo(item, index);
            }
        }
	}

	var _currentlyPlayingVideo = null;
		
	function autoPlay() {
		if (isMobile.phone) { return; }
		
		var videoInView;
		loadingQueue.some(function(item) {
			if (!item.bgImg && isGlobalPaused) { return; }
			if (item.type !== 'video') { return; }
			var top = item.node.getBoundingClientRect().top;
			var bottom = item.node.getBoundingClientRect().bottom;
			if (top < (windowHeight / 4) && bottom > 0) {
				videoInView = item;
				return true;
			}
		});
		
		
		// Play video in view
		if (videoInView && videoInView !== _currentlyPlayingVideo) {
			if (_currentlyPlayingVideo) {
                toggleVideoPlay(_currentlyPlayingVideo);
			}
			
            toggleVideoPlay(videoInView.node);
			_currentlyPlayingVideo = videoInView.node;
			return;
		}
		
		if (!videoInView && _currentlyPlayingVideo) {
            toggleVideoPlay(_currentlyPlayingVideo, true);
			_currentlyPlayingVideo = null;
		}
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

	
	function fetchVideo(item, index) {		
        if (!item.src || item.src.match('=')) { 
            return console.warn('Skipping multimedia video.', item.src);
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
		item.node.addEventListener('loadstart', function() {
			item.node.removeAttribute('height');
		}, false);

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
			var delimeter = (item.src.search('interactive.guim.co.uk') > -1) ? '' : '/';
			path = 'http://' + item.src + delimeter + imgSize + '.jpg';
		}
		
		image.onload = function() {
			if(item.bgImg){
				item.node.style.backgroundImage = "url(" + path + ")";
			} else {
				item.node.setAttribute("src", path);
				item.node.removeAttribute('height');
				item.node.classList.add('loaded');
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
			setVideoBitrate: setVideoBitrate,
			setImageSizes: setImageSizes,
			getVideoPosterImage: getVideoPosterImage
	};

});
