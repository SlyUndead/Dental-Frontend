import {
  GET_GROUPS_SUCCESS,
  GET_CHATS_SUCCESS,
  GET_GROUPS_FAIL,
  GET_CHATS_FAIL,
  GET_CONTACTS_SUCCESS,
  GET_CONTACTS_FAIL,
  GET_MESSAGES_SUCCESS,
  GET_MESSAGES_FAIL,
  POST_ADD_MESSAGE_SUCCESS,
  POST_ADD_MESSAGE_FAIL,
  DELETE_MESSAGE_FAIL,
  DELETE_MESSAGE_SUCCESS
} from "./actionTypes"

const INIT_STATE = {
  chats: [],
  groups: [],
  contacts: [],
  messages: [],
  error: {},
  loading: true
}

const Chat = (state = INIT_STATE, action) => {
  switch (action.type) {
    case GET_CHATS_SUCCESS:
      return {
        ...state,
        chats: action.payload,
        loading: true
      }

    case GET_CHATS_FAIL:
      return {
        ...state,
        error: action.payload,
      }

    case GET_GROUPS_SUCCESS:
      return {
        ...state,
        groups: action.payload,
      }

    case GET_GROUPS_FAIL:
      return {
        ...state,
        error: action.payload,
      }

    case GET_CONTACTS_SUCCESS:
      return {
        ...state,
        contacts: action.payload,
      }

    case GET_CONTACTS_FAIL:
      return {
        ...state,
        error: action.payload,
      }

    case GET_MESSAGES_SUCCESS:
      return {
        ...state,
        messages: action.payload,
        loading: true
      }

    case GET_MESSAGES_FAIL:
      return {
        ...state,
        error: action.payload,
      }

    case POST_ADD_MESSAGE_SUCCESS:
      return {
        ...state,
        messages: state.messages.map((item) => ({
          ...item,
          usermessages: [...item.usermessages, action.payload]
        }))
      }
    case POST_ADD_MESSAGE_FAIL:
      return {
        ...state,
        error: action.payload,
      }
    case DELETE_MESSAGE_SUCCESS:
      return {
        ...state,
        messages: state.messages.map((item) => ({
          ...item,
          usermessages: item.usermessages.filter(data => data.id !== action.payload)
        }))
      };
    case DELETE_MESSAGE_FAIL:
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state
  }
}

export default Chat
