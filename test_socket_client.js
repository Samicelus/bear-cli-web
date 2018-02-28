window.route_map = {};
let app_id = "5a7a6b4439d9032daa77f861";
let port = 13020;
let remoteIP = "testapi.runningdoctor.cn";
let jwt = "";
//let jwt = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0c2IiLCJqdGkiOiI2ODllNTlmN2JjZTgwNGEyZDg3Njg1ODlkM2Q2NDNlZiIsImlhdCI6MTUxNjY3MjI1Mi45MzcsImV4cCI6MTUxOTI2NDI1Mi45Mzd9.aX8rCquTcCslzEzS1SZiHAv2PIgMYZh7y8zfFtAV4Fo";
window.token;
window.battle;
const bear_cli = require('./bear-cli.js');
const bear_handlers = require('./handlers.js');
let bear = new bear_cli(remoteIP, port, app_id);
let handlers = new bear_handlers(bear);
bear.set_handlers(handlers);
window.current_room_id = "";

$("#log_button").click(()=>{
    jwt = $("#jwt").val();
    bear.set_jwt(jwt).then((ret)=>{
        if(ret){
            return bear.login();
        }
    }).then((ret)=>{
        console.log(`login ret:`,ret);
        $("#login_dep").hide(1000);
        $("#chat_dep").show(1000);
    }).catch((e)=>{
        console.log(e.stack||e);
    })
});

$("#test_expire").click(()=>{
    bear.reset_expire();
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
    let to_user_id = current_room_id;
    let data = {
        text_message:text_message,
        to_room_id:to_user_id
    }
    bear.request("chat.chat_handler.sendTextToRoom",data);
    $("#message").val("");
});

window.sendMediaToRoom = function(){
    let to_user_id = current_room_id;
    let fd = new FormData();
    for(let i = 0;i<$("#file_upload")[0].files.length;i++){
        fd.append("file_upload", $("#file_upload")[0].files[i.toString()]);
    }
    $.ajax({
        type: 'post',
        url: 'http://testapi.runningdoctor.cn/12133/uploadFiles',
        data: fd,
        cache: false,
        contentType: false,// 当有文件要上传时，此项是必须的，否则后台无法识别文件流的起始位置(详见：#1)
        processData: false,// 是否序列化data属性，默认true(注意：false时type必须是post，详见：#2)
        success: function(data) {
            if(data.result == "TRUE"){
                let files = data.data;
                files.forEach((ret_info)=>{
                    let send_data = {
                        url:ret_info.url,
                        to_room_id:to_user_id,
                        type: ret_info.type
                    };
                    bear.request("chat.chat_handler.sendMediaToRoom",send_data);
                })
            }
        }
    });
};

window.bind_method = function(target_type,target_id,chat_name){
    //console.log(target_type,target_id,chat_name);
    $("#chat_div").show(1000);
    $("#room_div").hide(1000);
    current_room_id = target_id;
    $.ajax(
        {
            url: "http://testapi.runningdoctor.cn/12133/getLogs?",
            headers:{
                "x-json-web-token":bear.get_jwt()
            },
            type:"post",
            data:{target_id:target_id, target_type: target_type, user_id:bear.get_user_id()},
            success: (data_received, status)=>{
                console.log(`getLogs:`,data_received)
                let logs = data_received.data;
                $("#chat_page").empty();
                $("#chat_page").append('<p style="height: 48px"></p>');
                $("#room_name").val(chat_name);
                logs.forEach((log)=>{
                    let user_id = bear.get_user_id();
                    let from = log.from;
                    let from_user_id = log.from.user_id;
                    let position = "left";
                    if(from_user_id == user_id){
                        position = "right";
                    }
                    let content = log.content;
                    let url = log.url;
                    let type = log.type;
                    switch(type){
                        case "text":
                            if(position == "right"){
                                $("#chat_page").append('<p style="text-align: '+position+'"><code>'+content+':['+from.nickname+']</code></p>');
                            }else{
                                $("#chat_page").append('<p style="text-align: '+position+'"><code>['+from.nickname+']:'+content+'</code></p>');
                            }
                            break;
                        case "image":
                            if(position == "right"){
                                $("#chat_page").append('<p style="text-align: '+position+'"><img width="304" height="228" src="'+url+'"></img><code>:['+from.nickname+']</code></p>');
                            }else{
                                $("#chat_page").append('<p style="text-align: '+position+'"><code>['+from.nickname+']:</code><img width="304" height="228" src="'+url+'"></img></p>');
                            }
                            break;
                        case "voice":
                            if(position == "right"){
                                $("#chat_page").append('<p style="text-align: '+position+'"><audio src="'+url+'"></audio><code>:['+from.nickname+']</code></p>');
                            }else{
                                $("#chat_page").append('<p style="text-align: '+position+'"><code>['+from.nickname+']:</code><audio src="'+url+'"></audio></p>');
                            }
                            break;
                        default:
                            break;
                    }
                })
            }
        }
    );
    // })
}

$("#show_create_room").click(()=>{
    $("#createRoom_div").show(1000);
});


$("#create_room").click(()=>{
    let with_user_id = $("#with_user_id").val();
    let with_user_id_2 = $("#with_user_id_2").val();
    let user_ids = [];
    user_ids.push(with_user_id);
    user_ids.push(with_user_id_2);
    let data = {
        user_ids:user_ids
    };
    bear.request("chat.chat_handler.createRoom",data).then(()=>{
        $("#creatRoom_div").hide(1000);
    }).catch((e)=>{
        console.log(e.stack||e);
    });
});

$("#back_to_rooms").click(()=>{
    $("#chat_div").hide(1000);
    $("#room_div").show(1000);
    window.current_room_id = "";
});

$("#get_my_rooms").click(()=>{
    let user_id = bear.get_user_id();
    $.ajax(
        {
            url: "http://testapi.runningdoctor.cn/12133/getMyRooms",
            headers:{
                "x-json-web-token":bear.get_jwt()
            },
            type:"post",
            data:{user_id: user_id},
            success: (data_received, status)=>{
                console.log(`getMyRooms:`,data_received);
                let rooms = data_received.data;
                $("#room_list").empty();
                if(rooms){
                    rooms.forEach((room)=>{
                        $("#room_list").append('<li class=\"list-group-item\" id=\"'+'room_'+room._id +'\" onclick=\"bind_method(\'room\',\''+ room._id+'\',\''+ room.room_name+'\')\"><span id=\"'+ room._id +'_unread\" class=\"badge\">'+ room.unread +'</span>'+ room.room_name +'</li>')
                    })
                }
            }
        }
    );
});

$("#show_invite_people").click(()=>{
    let members_div_display = $("#room_members_div").css("display");
    if(members_div_display == "none"){
        $("#invite_div").css("top","47px");
    }
    $("#invite_div").show(1000);
});

$("#invite").click(()=>{
    let invite_user_id = $("#invite_user_id").val();
    let invite_user_id_2 = $("#invite_user_id_2").val();
    let user_ids = [];
    user_ids.push(invite_user_id);
    user_ids.push(invite_user_id_2);
    let data = {
        user_ids:user_ids,
        room_id: current_room_id
    };
    bear.request("chat.chat_handler.invitePeopleToRoom",data).then(()=>{
        $("#invite_div").hide(1000);
    }).catch((e)=>{
        console.log(e.stack||e);
    });
});

$("#room_name").on('keypress',function(event) {
    if(event.keyCode == 13){
        let new_room_name = $("#room_name").val();
        let send_data = {
            room_id: current_room_id,
            new_room_name:new_room_name
        };
        bear.request("chat.chat_handler.changeRoomName",send_data).then(()=>{
            console.log(`change name to ${new_room_name}`);
        }).catch((e)=>{
            console.log(e.stack||e);
        });
    }
});

$("#message").on('keypress',function(event) {
    if(event.keyCode == 13){
        let text_message = $("#message").val();
        let to_user_id = current_room_id;
        let data = {
            text_message:text_message,
            to_room_id:to_user_id
        }
        bear.request("chat.chat_handler.sendTextToRoom",data);
        $("#message").val("");
    }
});


$("#show_room_members").click(()=>{
    let send_data = {
        room_id: current_room_id
    }
    bear.request("chat.chat_handler.showRoomMembers",send_data).then(()=>{
        let invite_div_display = $("#invite_div").css("display");
        if(invite_div_display != "none"){
            $("#invite_div").css("top","114px");
        }
        $("#room_members_div").show(1000);
    }).catch((e)=>{
        console.log(e.stack||e);
    });
});

$("#hide_room_members").click(()=>{
    $("#room_members_div").hide(1000);
    $("#invite_div").hide(1000);
});