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

    chat_handler(data){
        let content = data.content;
        let from = data.from;
        let type = data.type;
        let target_id = data.target_id;
        let current_chat_id = $("#current_chat_name").val();
        if(target_id == current_chat_id){
            if(from == bear.get_user_id()){
                $("#chat_page").append('<p><code style=\"float:right\">['+type+']'+content+'</code></p>')
            }else{
                $("#chat_page").append('<p><code>['+type+']'+content+'</code></p>')
            }
        }
    }
};

function affich(content){
    $("#afficher").html($("#afficher").html()+ "</br>" + content);
}

function refreshRooms(rooms){
    $("#room_list").html("");
    rooms.forEach((room)=>{
        $("#room_list").html($("#room_list").html()+ "</br>" + JSON.stringify(room));
    })
}


module.exports = bear_handlers;