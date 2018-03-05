window.route_map = {};
let port = 13020;
let remoteIP = "testapi.runningdoctor.cn";
let login_url = "http://testapi.runningdoctor.cn/12133/loginUser";
//let jwt = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0c2IiLCJqdGkiOiI2ODllNTlmN2JjZTgwNGEyZDg3Njg1ODlkM2Q2NDNlZiIsImlhdCI6MTUxNjY3MjI1Mi45MzcsImV4cCI6MTUxOTI2NDI1Mi45Mzd9.aX8rCquTcCslzEzS1SZiHAv2PIgMYZh7y8zfFtAV4Fo";
window.token;
window.battle;
const bear_cli = require('./bear-cli.js');
const bear_handlers = require('./handlers.js');
var bear = new bear_cli(login_url, remoteIP, port);
var handlers = new bear_handlers(bear);
bear.set_handlers(handlers);

$("#log_button").click(()=>{
    let jwt = $("#jwt").val();
    bear.set_jwt(jwt);
    bear.login(jwt);
    $("#login_dep").hide();
    $("#chat_dep").show();
    bear.request("user.user_handler.login",{});
});

$("#send").click(()=>{
    let text_message = $("#message").val();
    let to_user_id = $("#to_user_id").val();
    let data = {
        text_message:text_message,
        to_user_id:to_user_id
    }
    bear.request("chat.chat_handler.sendText",data);
});

$("#send_to_room").click(()=>{
    let text_message = $("#message").val();
    let to_user_id = $("#to_user_id").val();
    let data = {
        text_message:text_message,
        to_room_id:to_user_id
    }
    bear.request("chat.chat_handler.sendTextToRoom",data);
});

window.bind_method = function(target_type,target_id,chat_name){
    // $(".list-group-item").unbind().click(()=>{
    //     console.log(`list item clicked`)
    // let chat_name = $(this).html();
    // let target_type = $(this).attr('value').split('|')[0];
    // let target_id = $(this).attr('value').split('|')[1];
    console.log(target_type,target_id,chat_name)

    $.ajax(
        {
            url: "http://testapi.runningdoctor.cn/12133/getLogs?",
            headers:{
                "x-json-web-token":bear.get_jwt()
            },
            type:"post",
            data:{target_id:target_id, target_type: target_type, user_id:bear.get_user_id()},
            success: (data_received, status)=>{
                let logs = data_received.data;
                $("#chat_page").empty();
                $("#chat_page").append('<pre id=\"current_chat_name\" value=\"'+ target_id +'\">'+chat_name+'</pre>');
                logs.forEach((log)=>{
                    let content = log.content;
                    let from = log.from;
                    let type = log.type;
                    if(from == bear.get_user_id()){
                        $("#chat_page").append('<p><code style=\"float:right\">['+type+']'+content+'</code></p>')
                    }else{
                        $("#chat_page").append('<p><code>['+type+']'+content+'</code></p>')
                    }
                })
            }
        }
    );
    // })
}

$("#create_room").click(()=>{
    let with_user_id = $("#with_user_id").val();
    let members = {};
    with_user_id.split(',').forEach((user_id)=>{
        members[user_id]={nickname:"member"}
    })
    let data = {
        members:members
    }
    bear.request("chat.chat_handler.createRoom",data);
});

$("#get_my_rooms").click(()=>{
    $.ajax(
        {
            url: "http://testapi.runningdoctor.cn/12133/getMyRooms",
            headers:{
                "x-json-web-token":bear.get_jwt()
            },
            type:"post",
            data:{user_id: bear.get_user_id()},
            success: (data_received, status)=>{
                let rooms = data_received.data;
                $("#room_list").empty();
                rooms.forEach((room)=>{
                    $("#room_list").append('<li class=\"list-group-item\" value=\"'+'room|'+room._id +'\" onclick=\"bind_method(\'room\',\''+ room._id+'\',\''+ room.room_name+'\')\"><span class=\"badge\">'+ room.unread +'</span>'+ room.room_name +'</li>')
                })
            }
        }
    );
});

$("#get_my_chats").click(()=>{
    $.ajax(
        {
            url: "http://testapi.runningdoctor.cn/12133/getMyChats",
            headers:{
                "x-json-web-token":bear.get_jwt()
            },
            type:"post",
            data:{user_id: bear.get_user_id()},
            success: (data_received, status)=>{
                let chats = data_received.data;
                $("#chat_list").empty();
                chats.forEach((chat)=>{
                    $("#chat_list").append('<li class=\"list-group-item\" value=\"'+'user|'+chat.user_id +'\"  onclick=\"bind_method(\'user\',\''+chat.user_id+'\',\''+chat.nickname+'\')\"><span class=\"badge\">'+ chat.unread +'</span>'+ chat.nickname +'</li>')
                })
            }
        }
    );
});




function affich(content){
    $("#afficher").html($("#afficher").html()+ "</br>" + content);
}
