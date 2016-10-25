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
  var rows = decodeURIComponent(x).split('\n').map(function(x){return x.split('\t')})
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
  })
  return y
}


// load data
dashboard.jobs={}
dashboard.loadDt=function(cb,url){
  var uid = 'UID'+Math.random().toString().slice(2)
  dashboard.jobs[uid]=cb
  url=url||'https://script.google.com/macros/s/AKfycbz5NlgOdwfm_Llc6qOXrU5DY0dqddUlqBbJNqJpzBAOpFxxjpE/exec'
  $.getScript(url+'?callback=dashboard.jobs.'+uid)
}

// assemble UID
dashboard.UI=function(){
  h='<h4 id="TableauDashboardHeader" style="color:maroon">Tableau Dashboard for <span style="color:navy">'+dashboard.user+'</span> <a href="https://github.com/sbm-it/tableau" target="_blank"><i id="gitIcon" class="fa fa-github-alt" aria-hidden="true" style="color:maroon"></i></a></h4>'
  localStorage.removeItem('tableauDashboard') // TO FORCE LOGIN EVERYTIME
  h+="<hr>"
  h+='Key words: <span id="keywords"></span>'
  h+="<hr>"
  h+='<div id="bodyDiv">...</div>'
  appSpace.innerHTML=h
  dashboard.bodyDiv()
}
dashboard.bodyDiv=function(){
  var tbls = dashboard.dt[dashboard.user].tableau
  h='<h5 style="color:green">The following '+tbls.length+' Tableau Dashboards were assigned to you:</h5>'
  h+='<div id="assignedToYou"></div>'
  bodyDiv.innerHTML=h
  dashboard.keywords={}
  tbls.forEach(function(tbl,i){
    var p = document.createElement('p')
    var url='https://discovery.analytics.healtheintent.com/t/SBMCIN/views/'+tbl+'?:embed=y&:showShareOptions=true&:display_count=no'
    p.innerHTML=i+'. <a href="'+url+'" target="_blank">'+tbl+'</a> [<span id="show_'+i+'" style="color:green" onclick="dashboard.show(this)">show</span>]'
    bodyDiv.appendChild(p)
    p.style.cursor="pointer"
    var div = document.createElement('div')
    div.style.width='100%'
    div.style.height='100%'
    div.innerHTML='<iframe width="100%" height="100%" frameBorder="0" src="'+url+'"></iframe>'
    p.appendChild(div)
    div.hidden=true
  })
  /*
  h='<hr>'
  h+='<h5 style="color:green"> ... and an additional are also at hand</h5>'
  h+='<div id="NotAssignedToYou"></div>'
  bodyDiv.innerHTML+=h
  */

}
dashboard.show=function(that){
  var div = $('div',that.parentElement)[0]
  if(div.hidden){
    div.hidden=false
    that.textContent="hide"
    that.style.color="red"
  }else{
    div.hidden=true
    that.textContent="show"
    that.style.color="green"
  }
  4
}


dashboard() // start
