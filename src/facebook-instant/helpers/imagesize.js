module.exports =  function(context) {
  if (context.size === 'horizontal') {
    return 2000;
  }
  
  if (context.size === 'vertical') {
    return 2100;
  }
  
  if (context.size === 'freeform1') {
    return 1369;
  }
};