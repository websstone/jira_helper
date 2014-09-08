var JH = JH || {};

JH.home = 'https://jira.epam.com/';
JH.ISSUE_PATH = "jira/rest/api/2/issue/";
JH.dashboard = 'jira/activity?maxResults=6&providers=issues';
JH.SEARCH_JQL = {
    main      : 'jira/rest/api/2/search',
    sort      : ' ORDER BY ',
    initJQL   : 'status not in (Resolved, Closed) AND assignee in (currentUser())',
    maxResult : 10,
    fields    : 'key,summary,description,issuetype,priority,status',
    sortType  : {
        ASC: 'ASC',
        DESC : 'DESC'
    },
    sortFields : {
        priority : 'priority ',
        type : 'type ',
        updatedDate : 'updatedDate ',
        status : 'status '
    },
    getQueryText : function(sortField, sortType){
        console.log(JH.home + JH.SEARCH_JQL.main +
                        '?jql=' + JH.SEARCH_JQL.initJQL + JH.SEARCH_JQL.sort +
                        (sortField ? (JH.SEARCH_JQL.sortFields[sortField] ? JH.SEARCH_JQL.sortFields[sortField] : JH.SEARCH_JQL.sortFields.priority ) : JH.SEARCH_JQL.sortFields.priority ) +
                        (sortType ? (sortType == JH.SEARCH_JQL.sortType.ASC ? JH.SEARCH_JQL.sortType.ASC : JH.SEARCH_JQL.sortType.DESC) : JH.SEARCH_JQL.sortType.DESC) +
                        '&maxResults=' + JH.SEARCH_JQL.maxResult + '&fields=' + JH.SEARCH_JQL.fields);
        return JH.home + JH.SEARCH_JQL.main +
        '?jql=' + JH.SEARCH_JQL.initJQL + JH.SEARCH_JQL.sort +
        (sortField ? (JH.SEARCH_JQL.sortFields[sortField] ? JH.SEARCH_JQL.sortFields[sortField] : JH.SEARCH_JQL.sortFields.priority ) : JH.SEARCH_JQL.sortFields.priority ) +
        (sortType ? (sortType == JH.SEARCH_JQL.sortType.ASC ? JH.SEARCH_JQL.sortType.ASC : JH.SEARCH_JQL.sortType.DESC) : JH.SEARCH_JQL.sortType.DESC) +
        '&maxResults=' + JH.SEARCH_JQL.maxResult + '&fields=' + JH.SEARCH_JQL.fields;
    }
};

function Issue( id ) {
    this.id = id;
    this.url = 'https://jira.epam.com/jira/rest/api/2/issue/';
    this.fetch = function( headers  ) {
        var iss = this;
        $.ajax({
            type: 'GET',
            url : iss.url + iss.id,
            success : function( issue ) {
                iss.self = issue;
                headers.success( issue );
            },
            error : function( err ) {
                headers.error( err );
            }
        });
    }
}

JH.issueList = JH.issueList || {};
JH.issueList.issues = null;
JH.issueList.issueList = [];
JH.issueList.issueMap = {};

JH.issueList.renderIssues = function(JQL){
    var component = this;

    var $accordion = $( "#accordion" ),
        $loader = $( ".loader" );
    $accordion.remove();
    $('<div id="accordion"></div>').insertAfter('.foracc');
    $accordion = $('#accordion');
    //$('.foracc').
    $loader.show();
    component.loadIssue( JQL ,  function( err, issues ) {

        // alert(issues);
        if ( err || (!issues))  return;

        for ( var i = 0; i < issues.length; i++ ) {
            var $issue = $('<div/>');
            var $h3 = $('<h3/>');
            $h3.attr('issueId', issues[i].id );

            var issueUrl = JH.home + 'jira/browse/' + issues[i].key;
            var $link = $('<a/>').html('').attr('href', issueUrl );
            $link.addClass('link');
            var $iconLink = $('<span/>');
            $iconLink.addClass('ui-icon-extlink');
            $link.append( $iconLink );
            $h3.append( issues[i].key );
            $h3.append( $link );

            var $summary = $('<p/>').html('<span class="header">Summary:</span> ');
            $summary.append(issues[i].fields.summary);
            $summary.addClass('summary');
            $issue.append($summary);

            var $description = $('<p/>').html('<span class="header">Description:</span>'),
                status = issues[i].fields.status,
                $workflow = $("<div>").attr("id", "wf" + issues[i].key)
                                      .addClass("workflow")
                                      .data("issueId", issues[i].key)
                                      .click(JH.issueWorkflowAction);//TODO:add listener

            $workflow.append($("<p>").text("Workflow"))
                .append($("<img>").attr("src", "../images/desc.png"));
            $description.append( issues[i].fields.description );
            $description.addClass('description');
            $issue.append($description);
            $issue.append($("<div>").addClass("statusSection")
                .append($("<p>").text("Status: "))
                .append($("<img>").addClass("statusImage").attr("src", status.iconUrl).height(16).width(16).attr("alt",status.description))
                .append($("<p>").text(status.name))
                .append($workflow)
            );

            var $priority = $('<span/>').html('').addClass('priorityText');
            $priority.append( ' ' );
            $priority.append( issues[i].fields.priority.name );

            var $priorityIcon = $('<span/>').css('background', 'url("' +  issues[i].fields.priority.iconUrl + '") no-repeat' );
            $priorityIcon.addClass('priorityIcon');
            $priority.append( $priorityIcon );

            $h3.append(' ');
            $h3.append($priority);


            $accordion.append( $h3 );
            $accordion.append( $issue );
        }

        $loader.hide();
        $accordion.accordion({
            activate: function( event, ui ) {
                JH.issueList.reRenderIssue( ui.newHeader.attr("issueId"), ui.newPanel );
            }
        });
    });
};

JH.expandWF = function(el){
    el.addClass("expanded");
    $(el).find("img").eq(0).attr("src", "../images/asc.png");
};
JH.collapseWF = function(el){
    el.removeClass("expanded");
    $(el).find("img").eq(0).attr("src", "../images/desc.png");
};

JH.issueWorkflowAction = function (event) {
    var $this = $(event.currentTarget),
        id = $this.data("issueId");
    if(!$this.hasClass("expanded")) {

        JH.expandWF($this);

        $.ajax({
            url: JH.home + JH.ISSUE_PATH + id + "/transitions",
            success: function (data) {
                JH.drawWorkflowDropdown(data, id);
            }
        });
    }else{
        $(".wfDropdown").remove();
        JH.collapseWF($this);
    }
};

JH.changeStatusCallback = function(data, id){
    $.ajax({
        url : JH.home + JH.ISSUE_PATH + id,
        success : function(data) {
            $("#wf" + id).siblings("p").eq(1).text(data.fields.status.name);
            $("#wf" + id).siblings("img").attr("src", data.fields.status.iconUrl);
        },
        error : function(e) {
            $("#wf" + id).siblings("img").attr("src", "../images/warning.png");
        }
    });
};

JH.changeStatus = function(issueId, status){
    $(".statusSection img").attr("src", "../images/spinner.gif");
    $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        url: JH.home + JH.ISSUE_PATH + issueId + "/transitions",
        data: JSON.stringify({
            transition: status
        }),
        success: function(data){
            JH.changeStatusCallback(data, issueId);
        },
        error: function(){
            $("#wf" + issueId).siblings("img").attr("src", "../images/warning.png");
        }
    });
};

JH.drawWorkflowDropdown = function(data, id){
    if(data.transitions){
        var actions = $("<div>").addClass("wfDropdown");
        $.each(data.transitions, function(i, value){
            actions.append(
                $("<div>").text(value.name).addClass("workFlowItem")
                    .click(function(){
                        JH.changeStatus(id, value.id)
                    })
            );
        });
        $("#wf" + id).append(actions);
    }
};

JH.issueList.loadIssue = function(JQL , done){
    var component = this;
    $.ajax({
        type: 'GET',
        url : JQL,
        success : function( data ) {
            component.issues = data.issues;
            component.issueList = [];
            JH.issueList.issueList = [];
            for( var i = 0; i < component.issues.length; i++ ) {
                var issueObject = new Issue( component.issues[i].id );
                component.issueList.push( issueObject );
                component.issueMap[component.issues[i].id] = issueObject;
            }
            done( null, data.issues );
        },
        error : function( err ) {
            done(err);
            // err;
        }
    });
};

JH.issueList.renderIssue = function( issue, $container ) {

     var $summary = $('<p/>').html('<span class="header">Summary:</span> ');
     $summary.append(issue.fields.summary);
     $summary.addClass('summary');
     $container.append($summary);

     var $description = $('<p/>').html('<span class="header">Description:</span> '),
         status = issue.fields.status;
     $description.append( issue.fields.description );
     $description.addClass('description');
     $container.append($description);
     $container.append($("<div>").addClass("statusSection")
               .append($("<p>").text("Status: "))
               .append($("<img>").attr("src", status.iconUrl).height(16).width(16).attr("alt",status.description))
               .append($("<p>").text(status.name)));

     var attachments = issue.fields.attachment;
     if ( attachments && attachments.length ) {
        $attachments = $('<div/>');
        $attachments.append('Attachments: ');
        for( var i = 0; i < attachments.length; i++) {
            var $link = $('<a/>');
            $link.html(attachments[i].filename);
            $link.attr( 'href', attachments[i].content  );
            $attachments.append( $link );
        }
        $container.append( $attachments );
     }
}

JH.issueList.reRenderIssue = function( issueId, $container  ) {

    var issue = JH.issueList.issueMap[issueId];
    var render = function() {
        $container.html('');
        JH.issueList.renderIssue( issue.self, $container );
    }
    if ( issue ) {
        $container.html('<img class="loader" src="images/loading.gif"/>');
        if ( !issue.self ) {
            issue.fetch( {
                success : function() {
                    render();
                }
            });
        } else {
            render();
        }
    }
};

JH.bindEvents = function(){
    $('#buttons_bar span').on('click',function(){
        $('#buttons_bar span').removeClass('active');
        $(this).addClass('active');
        $('#sub_wrapper div.section').hide();
        $('#sub_wrapper div.section').eq($(this).index()).show();
    });

    $('body').on('click', 'a', function(){
        chrome.tabs.create({url: $(this).attr('href')});
        return false;
    });

    $('.btns .btn').on('click',function(){
        var $this = $(this),
            srt = $this.data('srt'),
            pr = $this.data('pr');

        $('.btns .btn').removeClass('asc desc')
        if(srt && pr){
            if(pr == 'ASC'){
                $this.data('pr','DESC'); $this.addClass('asc');
            }
            if(pr == 'DESC'){
                $this.data('pr','ASC'); $this.addClass('desc');
            }
            JH.issueList.renderIssues(JH.SEARCH_JQL.getQueryText(srt,pr));
        }
    });
};

JH.init = function(){

    JH.auth.checkPermissions();

    JH.bindEvents();

    JH.issueList.renderIssues(JH.SEARCH_JQL.getQueryText('priority','DESC'));

    $.ajax({
        url: JH.home + JH.dashboard,
        type: 'GET',
        success : function( data ) {
            var entries = $(data).find("title[type='html']"),
                issueType = $(data).find("link[title]");
            for(var i = 0 ; i < entries.length; i++){
                $('#dashboard_accordion').append('<div class="iss"><img class="dash_status" src="'+$(issueType[i]).attr('href')+'"/><div><p class="text_dash">'+entries[i].textContent + '</p></div></div>');
            }
        },
        error : function( err ) {
            $('#dashboard_accordion').append('Sorry ... try a bit later...');
        }
    })

};

$(document).ready(JH.init);
