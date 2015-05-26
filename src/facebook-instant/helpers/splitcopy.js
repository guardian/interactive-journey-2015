module.exports =  function(context, options) {
  var pars =  this.copy.replace(/[\r\n]+/g, '\n').split('\n');
  
  var ret = "";

  for(var i=0, j=pars.length; i<j; i++) {
    ret = ret + options.fn(pars[i]);
  }

  return ret;
};