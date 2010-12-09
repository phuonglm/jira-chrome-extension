var jira = {
		serverUrl:null,
		resolutinos: null,
		issuetypes: null,
		priorities: null,
		statuses: null,
		init: function(){
			jira.serverUrl = localStorage.getItem("url");
			jira.resolutions = chrome.extension.getBackgroundPage().loader.resolutions;
			jira.issuetypes = chrome.extension.getBackgroundPage().loader.issuetypes;
			jira.priorities = chrome.extension.getBackgroundPage().loader.priorities;
			jira.statuses = chrome.extension.getBackgroundPage().loader.statuses;
			
			jQuery.fn.dataTableExt.oSort['string-date-asc']  = function(x,y) {
				if(x == "")return 1;
				return ((x < y) ? -1 : ((x > y) ?  1 : 0));
			};
			jQuery.fn.dataTableExt.oSort['string-date-desc']  = function(x,y) {
				if(x == "")return 0;
				return ((x < y) ? 1 : ((x > y) ?  -1 : 0));
			};	
			
			if(jira.serverUrl)
			{
				jira.initHeaderLinks();
				if(localStorage.getItem('error')!="")
				{
					jira.error(localStorage.getItem('error'));
				 } else {
					try{
							jira.addTab("assignedtome", "Assigned to me");
							if(typeof(chrome.extension.getBackgroundPage().loader.issuesFromFilter["assignedtome"]) == "string")
								$("#table_assignedtome").append(
									$("<tr />").append($("<td />").text(chrome.extension.getBackgroundPage().loader.issuesFromFilter["assignedtome"]))
								);
							else
								jira.renderTableFromXml("assignedtome");
						jira.getIssuesFromFilter();
					}catch(e){
						alert(e);
					}
				}
			} else {
				jira.error('Configure first!');
			}
		},
		getIssuesFromFilter: function(){
			var filters = chrome.extension.getBackgroundPage().loader.filters;
			filters = filters.sort(function(a,b){return (a.id-b.id)});
			var str = '';
			$.map(filters, function(item, i){
					jira.addTab(item.id, item.name);
			});
			jira.tabs();
			$.map(filters, function(item, i){
					jira.renderTableFromXml(item.id);
		
			});
		},
		renderTableFromXml: function(id){
		
				$("#table_"+id).dataTable( {
				"bJQueryUI": false,
				"aaData": chrome.extension.getBackgroundPage().loader.issuesFromFilter[id],
				"aaSorting": [[4, "asc"],[ 5, "asc" ]],
				"aoColumns": [
						{ "sTitle": "", "sClass": "Icon",  "fnRender": function(obj) { 
							return (jira.issuetypes[obj.aData[ obj.iDataColumn ]])?("<img title=\""+ jira.issuetypes[obj.aData[ obj.iDataColumn ]].text +"\" src='" + jira.issuetypes[obj.aData[ obj.iDataColumn ]].icon +"'>"):"";}},
						{ "sTitle": "Key",  "fnRender": function(obj) { 
							return "<a target='_blank' href=\""+jira.url("/browse/"+ obj.aData[ obj.iDataColumn ])+"\">"+obj.aData[ obj.iDataColumn ]+"</a>" ;}},
						{ "sTitle": "Summary", "sClass": "Summary"},
						{ "sTitle": "Assignee",  "fnRender": function(obj) { 
							if(obj.aData[ obj.iDataColumn ] && obj.aData[ obj.iDataColumn ].length>10)return obj.aData[ obj.iDataColumn ].substr(0, 10)+"..."; else return obj.aData[ obj.iDataColumn ];}},
						{ "sType": "string-date","sTitle": "Due date",  "fnRender": function(obj) {
							return obj.aData[ obj.iDataColumn ]?chrome.extension.getBackgroundPage().loader.getDate(obj.aData[ obj.iDataColumn ]):"";
						}, "sClass": "Date"},
						//{ "sTitle": "Est.", "sClass": "Date"},
						{ "sTitle": "", "sClass": "Icon",  "fnRender": function(obj) { return (jira.priorities[obj.aData[ obj.iDataColumn ]])?("<img title=\""+ jira.priorities[obj.aData[ obj.iDataColumn ]].text +"\" src='" + jira.priorities[obj.aData[ obj.iDataColumn ]].icon+"'>"):"";}},
						{"sTitle": "Res.", "sClass": "ShortField"},
						{ "sTitle": "", "sClass": "Icon",  "fnRender": function(obj) { return (jira.statuses[obj.aData[ obj.iDataColumn ]])?("<img title=\""+ jira.statuses[obj.aData[ obj.iDataColumn ]].text +"\" src='" + jira.statuses[obj.aData[ obj.iDataColumn ]].icon+"'>"):"";}},
					]
				} );	
		},
		addTab: function(id, name){
			$("#tabHeader").append(
				$("<LI />").append(
					$("<A />").attr("href", "#div_"+id).text(name +
							((typeof(chrome.extension.getBackgroundPage().loader.issuesFromFilter[id]) != "string")?
									("(" + chrome.extension.getBackgroundPage().loader.issuesFromFilter[id].length + ")"):''))
				)
			);
			$("#tabs").append(
				$("<DIV />").attr("id", "div_"+id).append(
					$("<TABLE />").attr("id", "table_"+id).addClass("display")
				).append($("<BR />"))
			);
		},
		getXml: function(name, callback){
				var sXml = localStorage.getItem(name);
				var data = (new DOMParser()).parseFromString(sXml, "text/xml");
				callback(data);
		},
		error: function(err){
			$("body").append($("<DIV />").addClass("error").text(err)).
				append($("<HR />")).
				append($("<INPUT />").attr("type","button").attr("value", "Options").click(function(){
						var url = chrome.extension.getURL('options.html');
						chrome.tabs.create({ url: url, selected: true });
				})
			);
			$("#tabs").hide();
		}, 
		tabs: function(){
						$('#tabs').tabs({
						select: function(event, ui) {
							localStorage.setItem('lastOpenedTab', ui.index);
						},
						selected: (localStorage.getItem('lastOpenedTab')?localStorage.getItem('lastOpenedTab'):0)
					});
		},
		initHeaderLinks: function(){
				$("#HeaderLink").append(
					$("<button />").click(function(){
						chrome.extension.getBackgroundPage().loader.addTab(jira.url('/secure/ManageFilters.jspa'));
						window.close();
					}).text("Manage Filters").button({icons: {primary: "ui-icon-flag"},text: false})
				).append(
					$("<button />").click(function(){
						chrome.extension.getBackgroundPage().loader.addTab(chrome.extension.getURL('options.html'));
						window.close();
					}).text("Options").button({icons: {primary: "ui-icon-wrench"},text: false})
				).append(
					$("<button />").click(function(){
						chrome.extension.getBackgroundPage().loader.update();
						window.close();
					}).text("Reload issues").button({icons: {primary: "ui-icon-refresh"},text: false})
				).append(
					$("<button />").click(function(){
						chrome.extension.getBackgroundPage().loader.addTab("https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=QAWCRPFR2FW8S&lc=RU&item_name=JIRA%20Chrome%20extension&item_number=jira%2dchrome&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted");
						window.close();
					}).text("Contribute").button({icons: {primary: "ui-icon-heart"},text: false})
				);
		},
		url: function(str){
			return (jira.serverUrl + str);
		}
}

$(window).load(function () {
	setTimeout(jira.init, 0);
});