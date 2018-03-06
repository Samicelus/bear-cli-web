class bear_handlers{
    constructor(bear_cli){
        this._client = bear_cli;
        this._battle = {};
        this._current_state = 0;
    }


    return_handler(data){
        if(data.result){
            if(data.data&&data.data.route_map){
                //登录返回
                let route_map = data.data.route_map;
                for(let server_type in route_map){
                    this._client.set_app_socket(server_type, route_map[server_type].host, route_map[server_type].port);
                }
            }
            if(data.method_name){
                switch(data.method_name){
                    case "getMyRooms":
                        refreshRooms(data.data)
                        break;
                    default:
                        break;
                }
            }
        }
    }

    room_name_change_handler(data){
        let new_room_name = data.new_room_name;
        let target_id = data.target_id;
        $("#room_name_"+target_id).html(new_room_name);
        if(target_id == window.current_room_id){
            $("#room_name").val(new_room_name);
        }
    }

    show_room_members_handler(data){
        let members = data.members;
        let target_id = data.target_id;
        if(target_id == window.current_room_id){
            $("#room_members_div").empty();
            for(let user_id in members){
                $("#room_members_div").append(
                    '<div class="avatar" id="member_' + user_id + '">' +
                    '<img width="48" height="48" src="'+members[user_id].avatar+'" onerror="javascript:this.src=\'https://web.runningdoctor.cn/images/defaultHead.png\'"</img>' +
                    '<div class="avatar_name">'+ members[user_id].nickname +'</div>' +
                    '<div class="kick_tips" value="' + user_id + '">'+ '-' +'</div>' +
                    '</div>'
                );
            }
        }
    }

    quit_room_handler(data){
        let target_id = data.target_id;
        if(target_id == window.current_room_id){
            $("#invite_div").hide(500);
            $("#room_members_div").hide(500);
            $("#chat_div").hide(1000);
            $("#room_div").show(1000);
            window.current_room_id = "";
        }
        $("#room_"+target_id).remove();
    }

    into_room_handler(data){
        let user_id = this._client.get_user_id();
        let room_name = data.room_name;
        let target_id = data.target_id;
        let user_infos = data.user_infos;
        let time = data.time;
        let members_div_display = $("#room_members_div").css("display");
        user_infos.forEach((user_info)=>{
            if(target_id == window.current_room_id && members_div_display != "none"){
                $("#room_members_div").append(
                    '<div class="avatar" id="member_' + user_info.user_id + '">' +
                    '<img width="48" height="48" src="'+user_info.avatar+'" onerror="javascript:this.src=\'https://web.runningdoctor.cn/images/defaultHead.png\'"</img>' +
                    '<div class="avatar_name">'+ user_info.nickname +'</div>' +
                    '<div class="kick_tips" value="' + user_info.user_id + '">'+ '-' +'</div>' +
                    '</div>'
                );
            }
            if(user_info.user_id == user_id){
                $("#room_list").append('<li class=\"list-group-item\" id=\"'+'room_'+target_id +'\" onclick=\"bind_method(\'room\',\''+ target_id+'\',\''+ room_name+'\')\"><span id=\"'+ target_id +'_unread\" class=\"badge\">'+ 0 +'</span><div class="room_list_name" id="room_name_'+target_id+'">'+ room_name +'</div><div class="last_log" id="last_log_'+target_id+'">'+ time +'  系统:  你加入了群聊</div></li>')
            }
        })
    }

    kick_handler(data){
        let target_id = data.target_id;
        let user_info = data.user_info;
        let room_name = data.room_name;
        let members_div_display = $("#room_members_div").css("display");
        if(target_id == window.current_room_id && members_div_display != "none"){
            $("#member_"+user_info.user_id).remove();
        }
    }

    chat_handler(data){
        let user_id = this._client.get_user_id();
        let from = data.from;
        let from_user_id = data.from.user_id;
        let position = "chat_log_div_left";
        if(from_user_id == user_id){
            position = "chat_log_div_right";
        }
        let content = data.content;
        let url = data.url;
        let type = data.type;
        let target_id = data.target_id;
        let time = data.time;
        if(target_id == window.current_room_id){
            switch(type){
                case "system":
                    $("#chat_page").append(
                        '<div class="chat_log_div_center">' +
                        '<div class="avatar_content">' +
                        '<code class="chat_content">'+content+'</code>' +
                        '</div>' +
                        '</div>'
                    );
                    break;
                case "text":
                    $("#chat_page").append(
                        '<div class="'+position+'">' +
                            '<div class="log_info">' +
                                '<div class="chat_avatar_name">'+ from.nickname +'</div>' +
                                '<div class="chat_log_time">'+ time +'</div>' +
                            '</div>'+
                            '<div class="avatar_content">' +
                                '<img width="32" height="32" src="'+from.avatar+'" onerror="javascript:this.src=\'https://web.runningdoctor.cn/images/defaultHead.png\'"</img>' +
                                '<code class="chat_content">'+content+'</code>' +
                            '</div>' +
                        '</div>'
                    );
                    break;
                case "image":
                    $("#chat_page").append(
                        '<div class="'+position+'">' +
                            '<div class="log_info">' +
                                '<div class="chat_avatar_name">'+ from.nickname +'</div>' +
                                '<div class="chat_log_time">'+ time +'</div>' +
                            '</div>'+
                            '<div class="avatar_content">' +
                                '<img width="32" height="32" src="'+from.avatar+'" onerror="javascript:this.src=\'https://web.runningdoctor.cn/images/defaultHead.png\'"</img>' +
                                '<img class="chat_content" width="304" height="228" src="'+url+'"></img>' +
                            '</div>' +
                        '</div>'
                    );
                    break;
                case "voice":
                    $("#chat_page").append(
                        '<div class="'+position+'">' +
                            '<div class="log_info">' +
                                '<div class="chat_avatar_name">'+ from.nickname +'</div>' +
                                '<div class="chat_log_time">'+ time +'</div>' +
                            '</div>'+
                            '<div class="avatar_content">' +
                                '<img width="32" height="32" src="'+from.avatar+'" onerror="javascript:this.src=\'https://web.runningdoctor.cn/images/defaultHead.png\'"</img>' +
                                '<audio class="chat_content" src="'+url+'"></audio>' +
                            '</div>' +
                        '</div>'
                    );
                    break;
                default:
                    break;
            }
        }else{
            let current_unread = Number($("#"+target_id+"_unread").html());
            let new_unread = current_unread + 1;
            $("#"+target_id+"_unread").html(new_unread.toString());
            let last_log = `${time}  ${type=="system"?"系统":from.nickname}:  ${type == "system"?content:""}${type == "text"?content:""}${type == "image"?"发来了一张图片":""}${type == "voice"?"发来了一条语音":""}${type == "video"?"发来了一个视频":""}`;
            $("#last_log_"+target_id).html(last_log);
        }
    }
}

function refreshRooms(rooms){
    $("#room_list").html("");
    rooms.forEach((room)=>{
        $("#room_list").html($("#room_list").html()+ "</br>" + JSON.stringify(room));
    })
}


module.exports = bear_handlers;