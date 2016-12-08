console.log('dashboard.js loaded');

dashboard=function(){ // ini
  var TB = localStorage.tableauDashboard
  if(TB){
    TB=JSON.parse(TB)
  }else{TB={}}
  if(TB.user){dashboard.user=TB.user.toLowerCase()}
  if(dashboard.user){
    dashboard.loadDt(function(x){
      dashboard.dt = dashboard.tsv2json(x)
      dashboard.UI()
    })
  }else{ //login first
    var parms = {}      
    location.search.slice(1).split('&').forEach(function(pp){pp=pp.split('=');parms[pp[0]]=pp[1]})   
    location.hash.slice(1).split('&').forEach(function(pp){pp=pp.split('=');parms[pp[0]]=pp[1]})   
    console.log(parms)
    if((!parms.code)&&(!parms.id_token)){
      location.href='https://login.microsoftonline.com/common/oauth2/authorize?response_type=code&redirect_uri='+location.origin+location.pathname+'&client_id=04c089f8-213f-4783-9b5f-cfa7b227d50b'
    }
    if(!parms.id_token){
      location.href='https://login.windows.net/stonybrookmedicine.edu/oauth2/authorize?response_type=id_token&client_id=04c089f8-213f-4783-9b5f-cfa7b227d50b&redirect_uri='+location.origin+location.pathname+'&state='+parms.session_state+'&nonce='+parms.session_state
    }
    $.getScript('jwt-decode.min.js')
     .then(function(){
       decodedToken = jwt_decode(parms.id_token)
       TB.user=decodedToken.unique_name
       localStorage.setItem('tableauDashboard',JSON.stringify(TB))
       location.href=location.origin+location.pathname
     })
  }
}

//data wrangling
dashboard.tsv2json=function(x){
  var rows = decodeURIComponent(x).split(/[\n\r]+/).map(function(x){return x.split('\t')})
  y={}
  var parms = rows[0]
  rows.slice(1).forEach(function(r,i){
    var yi={
      Entity:r[0],  // note objects forced to be lower case
      Attribute:r[1],
      Value:r[2]
    }
    if(yi.Entity.match('@')){yi.Entity.toLowerCase()} // emails forced to lowercase
    // indexed y
    if(!y[yi.Entity]){y[yi.Entity]={}}
    if(!y[yi.Entity][yi.Attribute]){y[yi.Entity][yi.Attribute]=[]}
    y[yi.Entity][yi.Attribute].push(yi.Value)
    //y[yi.Entity][yi.Attribute]=yi.Value
  })
  return y
}


// load data
dashboard.jobs={}
dashboard.loadDt=function(cb,url){
  var uid = 'UID'+Math.random().toString().slice(2)
  dashboard.jobs[uid]=cb
  url=url||'https://script.google.com/a/macros/mathbiol.org/s/AKfycbzobhIrPHsDnBj30GLXjd7PPbgFP74feT751pteTvt45RHY7PQ/exec'
  $.getScript(url+'?callback=dashboard.jobs.'+uid)
}

// assemble UID
dashboard.UI=function(){
  h='<div id="TableauDashboardHeaderDiv" style="background-color:LightYellow">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<i id="TableauDashboardHeaderDate" style="color:navy;font-size:x-small">'+Date()+'<i><h5 id="TableauDashboardHeader" style="color:maroon">&nbsp;&nbsp;<img src="https://www.stonybrookmedicine.edu/sites/default/files/box-webfiles/img/stony-brook-medicine-logo-horizontal-300.png" height="40px"><br>&nbsp;&nbsp;Dashboard for <span style="color:navy">'+dashboard.user+'</span> <a href="https://github.com/sbm-it/dashboard" target="_blank"><i id="gitIcon" class="fa fa-github-alt" aria-hidden="true" style="color:maroon"></i></a></h5>&nbsp;</div>'
  localStorage.removeItem('tableauDashboard') // TO FORCE LOGIN EVERYTIME
  //h+="<hr>"
  h+='<div id="bodyDiv">...</div>'
  appSpace.innerHTML=h
  dashboard.bodyDiv()
}
dashboard.getDashboardsForUser=function(email){
  email = email || dashboard.user
  if(!dashboard.dt[email]){
    dashboard.dt[email]={dashboard:[]} // empty array if none found for this user
  }
  var dd = dashboard.dt[email].dashboard // array of dashboards assigned to that user
  var y = {}
  // this could be a good place to add other criteria, such as dashboards associated with 
  dd.forEach(function(d){
    var x = dashboard.dt[d]
    if(!y[d]){y[d]={};y[d].more={}} // register object only if it didn't exist already - so new attributes can also be appended 
    y[d].more.directUrl=true
    for(var i in x){
      y[d][i]=x[i]
    }
  })
  return y
}
dashboard.bodyDiv=function(){
  if(!localStorage.dashboardBookmarks){localStorage.setItem('dashboardBookmarks','[]')}
  dashboard.bookmarks=JSON.parse(localStorage.dashboardBookmarks)
  var dd = dashboard.getDashboardsForUser() // object with dashboards assigned to this user
  dashboard.bookmarks.forEach(function(d){
    if(dd[d]){
      dd[d].bookmarked=true
    }
  })
  //var urls = dashboard.dt[dashboard.user].url
  var n = Object.getOwnPropertyNames(dd).length
  h='<div id="keywordSelect">Keywords </div>'
  h+='<hr>'
  h+='<h4 style="color:maroon"><i class="fa fa-arrow-right" aria-hidden="true"></i> Dashboards selected for preloading ( <i class="fa fa-bookmark-o" aria-hidden="true"></i> ):</h4>'
  h+='<div id="bookmarkedDivs"></div>'
  h+='<hr>'
  h+='<h4 style="color:maroon"><i class="fa fa-arrow-right" aria-hidden="true"></i> Additional dashboards assigned to you:</h4>'
  h+='<div id="otherDivs"></div>'
  h+='<hr>'
  bodyDiv.innerHTML=h
  dashboard.keywords={}
  Object.getOwnPropertyNames(dd).forEach(function(di,i){
    var d = dd[di]
    var k = d.keywords || [''] // d.keywords
    d.keywords = k.join(' ').split(/[\s]+/g)
    d.keywords.forEach(function(ki){
      dashboard.keywords[ki] = dashboard.keywords[ki] || []
      dashboard.keywords[ki].push(di)
    })
  })
  dashboard.dbs=dd
  dashboard.buildDivs()
  dashboard.buildKeywordSelect()
}

dashboard.buildKeywordSelect=function(){
  dashboard.keywords
  4
}

dashboard.onclickBookmark=function(that){
  var div = that.parentElement.parentElement
  div.dt.bookmarked=true
  // add it to localStorage
  var bkm = JSON.parse(localStorage.dashboardBookmarks)
  bkm.push(div.id)
  localStorage.setItem('dashboardBookmarks',JSON.stringify(bkm))
  // move it to bookmarked dashboards
  bookmarkedDivs.appendChild(div)
  var fa = $('.fa',div)[0]
  fa.onclick=function(){dashboard.onclickUnBookmark(this)}
  fa.style.color='red'
  setTimeout(function(){
    fa.className="fa fa-bookmark"
  },200)
}
dashboard.onclickUnBookmark=function(that){
  var div = that.parentElement.parentElement
  div.dt.bookmarked=false
  // add it to localStorage
  var bkm = JSON.parse(localStorage.dashboardBookmarks)
  bkm.pop(bkm.indexOf(div.id))
  localStorage.setItem('dashboardBookmarks',JSON.stringify(bkm))
  // move it to bookmarked dashboards
  otherDivs.appendChild(div)
  var fa = $('.fa',div)[0]
  fa.onclick=function(){dashboard.onclickBookmark(this)}
  fa.style.color='blue'
  setTimeout(function(){
    fa.className="fa fa-bookmark-o"
  },300)
}

dashboard.onmouseoverBookmark=function(that){
  that.style.cursor="pointer"
  4
}

dashboard.buildDivs=function(){ // create dashboard Divs and spread them between bookmarkedDivs and otherDivs
  Object.getOwnPropertyNames(dashboard.dbs).forEach(function(di){
    var d = dashboard.dbs[di]
    d.div = document.createElement('div')
    d.div.id=di
    if(d.bookmarked){
      var h = '<h4><i style="color:red" class="fa fa-bookmark" aria-hidden="true" onclick="dashboard.onclickUnBookmark(this)" onmouseover="dashboard.onmouseoverBookmark(this)"></i> <a href="'+d.url.slice(-1)[0]+'" target="_blank">'+d.title.slice(-1)[0]+'</a> <span style="color:green;font-size:x-small">['+di+']<span></h4>'
      h += '<span style="color:navy">'+d.description.slice(-1)[0]+'</span> '
      bookmarkedDivs.appendChild(d.div)
    }else{
      var h = '<h4><i style="color:blue" class="fa fa-bookmark-o" aria-hidden="true" onclick="dashboard.onclickBookmark(this)" onmouseover="dashboard.onmouseoverBookmark(this)"></i> <a href="'+d.url.slice(-1)[0]+'" target="_blank">'+d.title.slice(-1)[0]+'</a> <span style="color:green;font-size:x-small">['+di+']<span></h4>'
      h += '<span style="color:navy">'+d.description.slice(-1)[0]+'</span> '
      otherDivs.appendChild(d.div)
    }
    d.div.innerHTML=h
    d.div.dt=d

    4
  })
  4
}
  /*
    var p = document.createElement('p')
    var url='https://discovery.analytics.healtheintent.com/t/SBMCIN/views/'+d+'?:embed=y&:showShareOptions=true&:display_count=no'
    p.innerHTML=i+'. <a href="'+url+'" target="_blank">'+d+'</a> [<span id="show_'+i+'" style="color:green" onclick="dashboard.show(this)">show</span>]'
    bodyDiv.appendChild(p)
    p.style.cursor="pointer"
    var div = document.createElement('div')
    div.style.width='100%'
    div.style.height='100%'
    div.innerHTML='<iframe width="100%" height="100%" frameBorder="0" src="'+url+'"></iframe>'
    p.appendChild(div)
    div.hidden=true
  })
  4
  */


dashboard.show=function(that){
  var div = $('div',that.parentElement)[0]
  if(div.hidden){
    div.hidden=false
    that.textContent="hide"
    that.style.color="blue"
  }else{
    div.hidden=true
    that.textContent="show"
    that.style.color="green"
  }
  4
}


dashboard() // start
