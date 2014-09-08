/**
 * Created by Dzmitry_Budzko on 9/5/2014.
 */
var JH = JH || {};
JH.auth = JH.auth || {};
JH.auth.AUTH_PATH = "jira/rest/auth/1/session";

JH.auth.checkPermissions = function(){
    $.ajax({
        url : JH.home + JH.auth.AUTH_PATH,
        async:false,
        error: JH.auth.drawLoginForm
    });
};

JH.auth.submit = function () {
    var login = $("#username").val(),
        password = $("#password").val();
    if(!login || !password) {
        alert("Login and password are required");
        return false;
    }

    JH.auth.login(login, password);
    return false;
};

JH.auth.login = function(login, password){
    $.ajax({
        url : JH.home + JH.auth.AUTH_PATH,
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({
            username: login,
            password: password
        }),
        success: JH.auth.success,
        error: JH.auth.authFail
    });
};

JH.auth.authFail = function(data){
    var $warEl = $(".loginFrom .warning"),
        warText = "Authentication failed: " + data.statusText;
    if($warEl.length > 0)
        $warEl.text(warText);
    else
        $(".loginFrom h2").after(
            $("<p>").text(warText).addClass("warning")
        );
};

JH.auth.drawLoginForm = function(){
    var result = $("<div>").addClass("authWrapper"),
        loginForm = $("<div>").addClass("loginFrom")
            .append($("<h2>").text("Authorization"))
            .append($("<form>")
                .append($("<label>").attr("for", "username").text("Login"))
                .append($("<input id='username' type='text' name='username' required>"))
                .append($("<label>").attr("for", "password").text("Password"))
                .append($("<input id='password' type='password' name='password' required>"))
                .append($("<button>").text("Log in").addClass("loginButton").click(JH.auth.submit)));

    $("#wrapper").after(result.append(loginForm));
};

JH.auth.success = function(){
    $(".authWrapper").remove();
    JH.init();
};
