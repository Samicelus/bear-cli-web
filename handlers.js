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
        $("#room_"+target_id).html(new_room_name);
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
                    '<div class="avatar" >' +
                    '<img width="48" height="48" src="'+members[user_id].avatar+'" onerror="javascript:this.src=\'https://web.runningdoctor.cn/images/defaultHead.png\'"</img>' +
                    '<div class="avatar_name">'+ members[user_id].nickname +'</div>' +
                    '</div>'
                );
            }
        }
    }

    chat_handler(data){
        let user_id = this._client.get_user_id();
        let from = data.from;
        let from_user_id = data.from.user_id;
        let position = "left";
        if(from_user_id == user_id){
            position = "right";
        }
        let content = data.content;
        let url = data.url;
        let type = data.type;
        let target_id = data.target_id;
        if(target_id == window.current_room_id){
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
        }else{

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