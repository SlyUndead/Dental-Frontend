import React, { useEffect, useRef, useState } from 'react'
import { connect } from "react-redux";
import classnames from "classnames";

//Import Action to copy breadcrumb items from local state to redux state
import { setBreadcrumbItems } from "../../store/actions";
import SimpleBar from 'simplebar-react/dist';
import user2 from "../../assets/images/users/user-2.jpg";
import { Card, CardBody, Dropdown, Col, DropdownItem, DropdownMenu, DropdownToggle, Nav, NavLink, NavItem, TabContent, TabPane, Row, UncontrolledDropdown, Button, Input, UncontrolledAlert } from 'reactstrap';
import { Link } from 'react-router-dom';

import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";

import {
    deleteMessage as onDeleteMessage,
    addMessage as onAddMessage,
    getChats as onGetChats,
    getContacts as onGetContacts,
    getGroups as onGetGroups,
    getMessages as onGetMessages,
} from "store/actions";
import Spinners from 'components/Common/Spinner';

const Chat = (props) => {
    document.title = "Chat | Lexa - Responsive Bootstrap 5 Admin Dashboard";

    const breadcrumbItems = [
        { title: "Lexa", link: "#" },
        { title: "Chat", link: "#" },
        { title: "Chat", link: "#" },
    ]

    useEffect(() => {
        props.setBreadcrumbItems('Chat', breadcrumbItems)
    })

    const [singlebtn, setSinglebtn] = useState(false)
    const [singlebtn1, setSinglebtn1] = useState(false)
    const [singlebtn2, setSinglebtn2] = useState(false)


    const dispatch = useDispatch();

    const selectChatState = (state) => state.chat;
    const ChatProperties = createSelector(
        selectChatState,
        (Chat) => ({
            chats: Chat.chats,
            groups: Chat.groups,
            contacts: Chat.contacts,
            messages: Chat.messages,
            loading: Chat.loading
        })
    );

    const { chats, groups, contacts, messages, loading } = useSelector(ChatProperties);
    const [messagesData, setMessagesData] = useState();
    const [isLoading, setLoading] = useState(loading)

    // const Chat_Box_Username2 = "Henry Wells"
    const [currentRoomId, setCurrentRoomId] = useState(1);
    // eslint-disable-next-line no-unused-vars
    const currentUser = {
        name: "Henry Wells",
        isActive: true,
    };
    const [activeTab, setactiveTab] = useState("1");
    const [Chat_Box_Username, setChat_Box_Username] = useState("Jennie Sherlock");
    // eslint-disable-next-line no-unused-vars
    const [Chat_Box_User_Status, setChat_Box_User_Status] = useState("online");
    const [curMessage, setcurMessage] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [isdisable, setDisable] = useState(false);

    useEffect(() => {
        dispatch(onGetChats());
        dispatch(onGetGroups());
        dispatch(onGetContacts());
        dispatch(onGetMessages(currentRoomId));
    }, [currentRoomId, dispatch]);
    
    
    useEffect(() => {
        const a = (messages || []).find(i => i.id);
        const a1 = a?.usermessages[a?.usermessages.length - 2]
        const a2 = a?.usermessages[a?.usermessages.length - 1]
        if (a2?.isSameTime) {
            setMessagesData((messages || []).map((item) => {
                const updateMessage = item.usermessages.filter((data) => a2.time === a1.time ?
                    { ...data, id: a1.id, to_id: data.to_id, msg: data.msg, isSameTime: a1.time === a2.time, images: data.images, time: a1.time = 0 }
                    : { ...item });
                return { ...item, usermessages: updateMessage }
            }))
        } else {
            setMessagesData(messages)
        }
    }, [messages])

    const toggleTab = tab => {
        if (activeTab !== tab) {
            setactiveTab(tab);
        }
    };

    //Use For Chat Box
    const userChatOpen = (chat) => {
        setChat_Box_Username(chat.name);
        setChat_Box_User_Status(chat.status)
        setCurrentRoomId(chat.roomId);
        dispatch(onGetMessages(chat.roomId));
    };

    // search data 
    // const handeleSearch = (ele) => {
    //     handleSearchData({ setState: setMessagesData, data: messages, item: ele.value })
    // }
    const currentTime = new Date();
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const time = `${hours}: ${minutes}`
    const addMessage = () => {
        if (curMessage !== "" || selectedImage !== null) {
            const newMessage = {
                id: Math.floor(Math.random() * 100),
                to_id: 2,
                msg: curMessage,
                isSameTime: true,
                images: selectedImage,
                time: time,
            };
            dispatch(onAddMessage(newMessage));
            setcurMessage("");
            setDisable(false)
            setSelectedImage(null)
        }
    };


    const onKeyPress = e => {
        const { key, value } = e;
        if (key === "Enter") {
            setcurMessage(value);
            setDisable(true)
            addMessage();
        }
    };

    //serach recent user
    const searchUsers = () => {
        var input, filter, ul, li, a, i, txtValue;
        input = document.getElementById("search-user");
        filter = input.value.toUpperCase();
        ul = document.getElementById("recent-list");
        li = ul.getElementsByTagName("li");
        for (i = 0; i < li.length; i++) {
            a = li[i].getElementsByTagName("a")[0];
            txtValue = a.textContent || a.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                li[i].style.display = "";
            } else {
                li[i].style.display = "none";
            }
        }
    };

    const [deleteMsg, setDeleteMsg] = useState("");
    const toggle_deleMsg = (id) => {
        setDeleteMsg(!deleteMsg);
        dispatch(onDeleteMessage(id))
    };

    const [copyMsgAlert, setCopyMsgAlert] = useState(false);
    const copyMsg = (ele) => {
        var copyText = ele.closest(".conversation-list").querySelector("p").innerHTML;
        navigator.clipboard.writeText(copyText);
        setCopyMsgAlert(true)
        if (copyText) {
            setTimeout(() => {
                setCopyMsgAlert(false)
            }, 1000)

        }
    };

    // scroll simple bar
    const scroollRef = useRef(null);
    useEffect(() => {
        if (scroollRef.current) {
            scroollRef.current.getScrollElement().scrollTop = scroollRef.current.getScrollElement().scrollHeight;
        }
    }, [messages])


    return (
        <React.Fragment>

            <div className="d-lg-flex">
                <Card className="chat-leftsidebar">
                    <CardBody>

                        <div className="text-center bg-light rounded px-4 py-3">
                            <div className="text-end">
                                <Dropdown className="chat-noti-dropdown"
                                    isOpen={singlebtn}
                                    toggle={() => setSinglebtn(!singlebtn)}

                                >
                                    <DropdownToggle  tag="a" className="p-0">
                                        <i className="mdi mdi-cog"></i>
                                    </DropdownToggle>
                                    <DropdownMenu className="dropdown-menu-end">
                                        <DropdownItem>Profile</DropdownItem>
                                        <DropdownItem>Edit</DropdownItem>
                                        <DropdownItem>Add Contact</DropdownItem>
                                        <DropdownItem>Setting</DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            </div>
                            <div className="chat-user-status">
                                <img src={user2} className="avatar-md rounded-circle" alt="" />
                                <div className="">
                                    <div className="status"></div>
                                </div>
                            </div>
                            <h5 className="font-size-16 mb-1 mt-3"><Link to="#" className="text-reset">{Chat_Box_Username} </Link></h5>
                            <p className="text-muted mb-0">Available</p>
                        </div>
                    </CardBody>

                    <div className="p-3">
                        <div className="search-box position-relative">
                            <Input type="text" onKeyUp={searchUsers} className="form-control rounded border" placeholder="Search..." />
                            <i className="mdi mdi-magnify search-icon"></i>
                        </div>
                    </div>

                    <div className="chat-leftsidebar-nav">
                        <Nav pills justified className="bg-light m-3 rounded">
                            <NavItem >
                                <NavLink
                                    className={classnames({
                                        active: activeTab === "1",
                                    })}
                                    onClick={() => {
                                        toggleTab("1");
                                    }}
                                >
                                    <i className="bx bx-chat font-size-20 d-sm-none"></i>
                                    <span className="d-none d-sm-block">Chat</span>
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({
                                        active: activeTab === "2",
                                    })}
                                    onClick={() => {
                                        toggleTab("2");
                                    }}
                                >
                                    <i className="bx bx-group font-size-20 d-sm-none"></i>
                                    <span className="d-none d-sm-block">Groups</span>
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({
                                        active: activeTab === "3",
                                    })}
                                    onClick={() => {
                                        toggleTab("3");
                                    }}
                                >
                                    <i className="bx bx-book-content font-size-20 d-sm-none"></i>
                                    <span className="d-none d-sm-block">Contacts</span>
                                </NavLink>
                            </NavItem>
                        </Nav>
                        <TabContent activeTab={activeTab}>
                            <TabPane tabId="1">
                                <SimpleBar className="chat-message-list">
                                    <div className="pt-3">
                                        <div className="px-3">
                                            <h5 className="font-size-14 mb-3">Recent</h5>
                                        </div>
                                        <ul className="list-unstyled chat-list p-3">
                                            {
                                                isLoading ? <Spinners setLoading={setLoading} /> :
                                                    <SimpleBar>
                                                        {chats.map((chat) => (
                                                            <li
                                                                key={chat.id + chat.status}
                                                                className={
                                                                    currentRoomId === chat.roomId
                                                                        ? "active"
                                                                        : ""
                                                                }
                                                            >
                                                                <Link
                                                                    to="#"
                                                                    onClick={() => {
                                                                        userChatOpen(chat);
                                                                    }}
                                                                >
                                                                    <div className="d-flex align-items-center">
                                                                        {chat.isImg ?
                                                                            <div className={`flex-shrink-0 user-img ${chat.status} align-self-center me-3`}>
                                                                                <div className="avatar align-self-center">
                                                                                    <span className="avatar-title rounded-circle bg-primary-subtle text-primary font-size-16 font-size-18">
                                                                                        {chat.profile}
                                                                                    </span>
                                                                                </div>
                                                                                <span className="user-status"></span>
                                                                            </div>
                                                                            :
                                                                            <div className={`flex-shrink-0 user-img ${chat.status} align-self-center me-3`}>
                                                                                <img src={chat.image} className="rounded-circle avatar" alt="" />
                                                                                <span className="user-status"></span>
                                                                            </div>
                                                                        }

                                                                        <div className="flex-grow-1 overflow-hidden">
                                                                            <h5 className="text-truncate font-size-15 mb-0">{chat.name}</h5>
                                                                            <p className="text-muted mb-0 mt-1 text-truncate">{chat.description} </p>
                                                                        </div>
                                                                        <div className="flex-shrink-0 ms-3">
                                                                            <span className="badge bg-danger rounded-pill">{chat.time}</span>
                                                                        </div>

                                                                    </div>
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </SimpleBar>
                                            }
                                        </ul>
                                    </div>
                                </SimpleBar>
                            </TabPane>

                            <TabPane tabId="2">
                                <SimpleBar className="chat-message-list">
                                    <div className="pt-3">
                                        <div className="px-3">
                                            <h5 className="font-size-14 mb-3">Groups</h5>
                                        </div>
                                        <ul className="list-unstyled chat-list p-3 pt-0">
                                            {groups &&
                                                groups.map(group => (
                                                    <li key={"test" + group.image} className={currentRoomId === group.roomId ? "active" : ""}>
                                                        <Link
                                                            to="#"
                                                            onClick={() => {
                                                                userChatOpen(
                                                                    group
                                                                );
                                                            }}
                                                        >
                                                            <div className="d-flex align-items-center">
                                                                <div className="flex-shrink-0 avatar me-3">
                                                                    <span className="avatar-title rounded-circle bg-primary-subtle  text-primary font-size-16">
                                                                        {group.image}
                                                                    </span>
                                                                </div>

                                                                <div className="flex-grow-1">
                                                                    <h5 className="font-size-13 mb-0">{group.name}</h5>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    </li>
                                                ))}
                                        </ul>
                                    </div>
                                </SimpleBar>
                            </TabPane>

                            <TabPane tabId="3">
                                <SimpleBar className="chat-message-list">
                                    <div className="pt-3">
                                        <div className="px-3">
                                            <h5 className="font-size-14 mb-3">Contacts</h5>
                                        </div>

                                        <div className="p-3 pt-0">
                                            {contacts &&
                                                contacts.map(contact => (
                                                    <div
                                                        key={"test_" + contact.category}
                                                        className={
                                                            contact.category === "A" ? "" : "mt-4"
                                                        }
                                                    >
                                                        <div className="px-3 contact-list">{contact.category}</div>
                                                        <ul className="list-unstyled chat-list">
                                                            {contact.child.map(array => (
                                                                <li >
                                                                    <Link
                                                                        to="#"
                                                                        onClick={() => {
                                                                            userChatOpen(
                                                                                array
                                                                            );
                                                                        }}
                                                                    >
                                                                        <h5 className="font-size-13 mb-0">{array.name}</h5>
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                ))}
                                        </div>
                                    </div>
                                </SimpleBar>
                            </TabPane>
                        </TabContent>
                    </div>

                </Card>


                <div className="w-100 user-chat mt-4 mt-sm-0 ms-lg-3">
                    <Card>
                        <div className="p-3 px-lg-4 border-bottom">
                            <Row>
                                <Col xl={4} className="col-7">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0 avatar me-3 d-sm-block d-none">
                                            <img src={user2} alt="" className="img-fluid d-block avatar rounded-circle" />
                                        </div>
                                        <div className="flex-grow-1">
                                            <h5 className="font-size-16 mb-1 text-truncate"><Link to="#" className="text-reset">Jennie Sherlock</Link></h5>
                                            <p className="text-muted text-truncate mb-0">Online</p>
                                        </div>
                                    </div>
                                </Col>
                                <Col xl={8} className="col-5">
                                    <ul className="list-inline user-chat-nav text-end mb-0">
                                        <li className="list-inline-item">
                                            <Dropdown
                                                isOpen={singlebtn1}
                                                toggle={() => setSinglebtn1(!singlebtn1)}
                                            >
                                                <DropdownToggle className="btn nav-btn" tag="a">
                                                    <i className="bx bx-search"></i>
                                                </DropdownToggle>
                                                <DropdownMenu className="dropdown-menu-end dropdown-menu-md p-2">
                                                    <form className="px-2">
                                                        <div>
                                                            <input type="text" className="form-control border bg-light-subtle" placeholder="Search..." />
                                                        </div>
                                                    </form>
                                                </DropdownMenu>
                                            </Dropdown>
                                        </li>

                                        <li className="list-inline-item">
                                            <Dropdown
                                                isOpen={singlebtn2}
                                                toggle={() => setSinglebtn2(!singlebtn2)}
                                            >
                                                <DropdownToggle className="btn nav-btn" tag="a">
                                                    <i className="bx bx-dots-horizontal-rounded"></i>
                                                </DropdownToggle>
                                                <DropdownMenu className="dropdown-menu-end">
                                                    <DropdownItem >Profile</DropdownItem>
                                                    <DropdownItem >Archive</DropdownItem>
                                                    <DropdownItem >Muted</DropdownItem>
                                                    <DropdownItem >Delete</DropdownItem>
                                                </DropdownMenu>
                                            </Dropdown>
                                        </li>
                                    </ul>
                                </Col>
                            </Row>
                        </div>

                        <SimpleBar ref={scroollRef} className="chat-conversation p-4">
                            {isLoading ? (<Spinners setLoading={setLoading} />) : (
                                <ul className="list-unstyled mb-0">
                                    {
                                        messagesData && (messagesData || []).map((message) => {
                                            return message.usermessages.map((userMsg, index) => {
                                                return (
                                                    <li
                                                        key={index}
                                                        className={
                                                            userMsg.to_id === 1 ? "" : "right"
                                                        }
                                                    >
                                                        <div className="conversation-list">
                                                            <div className="d-flex">
                                                                {userMsg.images && <img src={userMsg.images} className="rounded-circle avatar" alt="" />}
                                                                <div className="flex-1 ms-3">
                                                                    <div className="d-flex justify-content-between">
                                                                        <h5 className="font-size-16 conversation-name align-middle">{userMsg.to_id === 1 ? message.sender : "You"}</h5>
                                                                        {userMsg.time !== 0 && <span className="time fw-normal text-muted me-0 me-md-4">{userMsg.time}</span>}
                                                                    </div>
                                                                    <div className="ctext-wrap">
                                                                        <div className="ctext-wrap-content">
                                                                            <p className="mb-0">
                                                                                {userMsg.msg}
                                                                            </p>
                                                                        </div>
                                                                        <UncontrolledDropdown className="align-self-start">
                                                                            <DropdownToggle tag="a">
                                                                                <i className="bx bx-dots-vertical-rounded"></i>
                                                                            </DropdownToggle>
                                                                            <DropdownMenu>
                                                                                <DropdownItem onClick={(e) => copyMsg(e.target)}>
                                                                                    Copy
                                                                                </DropdownItem>
                                                                                <DropdownItem>
                                                                                    Save
                                                                                </DropdownItem>
                                                                                <DropdownItem>
                                                                                    Forward
                                                                                </DropdownItem>
                                                                                <DropdownItem onClick={(e) => toggle_deleMsg(userMsg.id)}>
                                                                                    Delete
                                                                                </DropdownItem>
                                                                            </DropdownMenu>
                                                                        </UncontrolledDropdown>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                )
                                            })
                                        })
                                    }
                                </ul>
                            )}
                        </SimpleBar>
                        {copyMsgAlert && <UncontrolledAlert color='warning' dismissible role="alert">  Message copied</UncontrolledAlert>}
                        <div className="p-3 border-top">
                            <div className="row">
                                <div className="col">
                                    <div className="position-relative">
                                        <input type="text"
                                            value={curMessage}
                                            onKeyPress={onKeyPress}
                                            onChange={e => { setcurMessage(e.target.value); setDisable(true) }}
                                             className="form-control border chat-input" placeholder="Enter Message..." />
                                    </div>
                                </div>
                                <div className="col-auto">
                                    <Button
                                    type="button"
                                    color="primary" 
                                    disabled={!isdisable}
                                    onClick={() => addMessage()}
                                    className="chat-send w-md waves-effect waves-light">
                                        <span className="d-none d-sm-inline-block me-2">
                                            Send</span> <i className="mdi mdi-send float-end"></i></Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

            </div>


        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(Chat);
