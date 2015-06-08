module.exports =  function() {
	if(this['facebook-ignore'] === 'true'){
		return 'blank';
	}
	return this.block;
};