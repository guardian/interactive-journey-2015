module.exports =  function(context, options) {
  var pars =  this.copy.replace(/[\r\n]+/g, '\n').split('\n');
  var ret = "";
  
  pars.forEach(function(par) {
    if (par.trim() === "") { return; }
    ret = ret + options.fn(par);
  });

  return ret;
};