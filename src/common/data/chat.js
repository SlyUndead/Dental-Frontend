//import Images
import avatar02 from "../../assets/images/users/user-2.jpg";
import avatar03 from "../../assets/images/users/user-3.jpg";
import avatar04 from "../../assets/images/users/user-4.jpg";
import avatar06 from "../../assets/images/users/user-6.jpg";

const chats = [
  {
    id: 1,
    roomId: 1,
    status: "intermediate",
    image: avatar02,
    name: "Jennie Sherlock",
    description: "Hey! there I'm available",
    time: "05 min",
  },
  {
    id: 2,
    roomId: 2,
    status: "online",
    image: avatar03,
    name: "Adam Miller",
    description: "I've finished it! See you so",
    time: "12 min",
  },
  {
    id: 3,
    roomId: 3,
    status: "online",
    name: "Keith Gonzales",
    description: "This theme is awesome!",
    time: "24 min",
    isImg: true,
    profile: "K",
  },
  {
    id: 4,
    roomId: 4,
    status: "intermediate",
    image: avatar04,
    name: "Jose Vickery",
    description: "Nice to meet you",
    time: "1 hr",
  },
  {
    id: 5,
    roomId: 5,
    status: "offline",
    name: "Mitchel Givens",
    description: "Hey! there I'm available",
    time: "3 hrs",
    isImg: true,
    profile: "M",
  },
  {
    id: 6,
    roomId: 6,
    status: "online",
    image: avatar06,
    name: "Stephen Hadley",
    description: "I've finished it! See you so",
    time: "5 hrs",
  },
  {
    id: 7,
    roomId: 7,
    status: "online",
    name: "Keith Gonzales",
    description: "This theme is awesome!",
    time: "24 min",
    isImg: true,
    profile: "K",
  },
]

const groups = [
  { id: 1, roomId: 1, image: "G", name: "General", status: "intermediate", },
  { id: 2, roomId: 2, image: "R", name: "Reporting", status: "online", },
  { id: 3, roomId: 3, image: "M", name: "Meeting", status: "intermediate", },
  { id: 4, roomId: 4, image: "A", name: "Project A", status: "online", },
  { id: 5, roomId: 5, image: "B", name: "Project B", status: "intermediate", },
]

const contacts = [
  {
    id: 1,
    category: "A",
    child: [
      { id: 1, roomId: 1, name: "Adam Miller", status: "online" },
      { id: 2, roomId: 2, name: "Alfonso Fisher", status: "intermediate" },
    ],
  },
  {
    id: 2,
    roomId: 2,
    category: "B",
    child: [{ id: 3, roomId: 3, name: "Bonnie Harney", status: "online" }],
  },
  {
    id: 3,
    roomId: 3,
    category: "C",
    child: [
      { id: 4, roomId: 4, name: "Charles Brown", status: "intermediate" },
      { id: 5, roomId: 5, name: "Carmella Jones", status: "online" },
      { id: 6, roomId: 6, name: "Carrie Williams", status: "intermediate" },
    ],
  },
  {
    id: 4,
    roomId: 4,
    category: "D",
    child: [{ id: 7, roomId: 7, name: "Dolores Minter", status: "online" }],
  },
]


const messages = [
  {
    id: 1,
    roomId: 1,
    sender: "Jennie Sherlock",
    message: "Hello!",
    usermessages: [
      { id: 1, to_id: 1, msg: "Good morning 😊", time: "10:00", isImages: false },
      { id: 2, to_id: 2, msg: "Hi, How are you? What about our next meeting?", isImages: false, time: "10:02" },
      { id: 3, to_id: 1, msg: "Yeah everything is fine", isImages: false, time: "10:06" },
      { id: 4, to_id: 2, msg: "& Next meeting tomorrow 10.00AM", isImages: false, time: "10:06" },
      { id: 5, to_id: 1, msg: "Wow that's great", isImages: false, time: "10:07" },
    ]
  },
  {
    id: 2,
    roomId: 2,
    sender: "Adam Miller",
    message: "Hello!",
    usermessages: [
      { id: 6, to_id: 1, msg: "Hi, How are you? What about our next meeting?", time: "10:02" },
      { id: 7, to_id: 2, msg: "Yeah everything is fine", time: "10:06" },
      { id: 8, to_id: 1, msg: "& Next meeting tomorrow 10.00AM", time: "10:06" },
    ]
  },
  {
    id: 3,
    roomId: 3,
    sender: "Keith Gonzales",
    message: "Hello!",
    time: "11:02",
    usermessages: [
      { id: 1, to_id: 1, msg: "Yeah everything is fine", time: "10:06" },
      { id: 2, to_id: 2, msg: "& Next meeting tomorrow 10.00AM", time: "10:06" },
      { id: 3, to_id: 1, msg: "Wow that's great", time: "10:07" },
    ]
  },

  {
    id: 4,
    roomId: 4,
    sender: "Jose Vickery",
    message: "Hello!",
    time: "1 hr",
    usermessages: [
      { id: 1, to_id: 1, msg: "Good morning 😊", time: "10:00" },
      { id: 2, to_id: 2, msg: "Yeah everything is fine", time: "10:06" },
    ]
  },
  {
    id: 5,
    roomId: 5,
    sender: "Mitchel Givens",
    message: "Hello!",
    time: "11:05",
    usermessages: [
      { id: 1, to_id: 1, msg: "Good morning 😊", time: "10:00" },
      { id: 2, to_id: 2, msg: "& Next meeting tomorrow 10.00AM", time: "10:06" },
      { id: 3, to_id: 1, msg: "Wow that's great", time: "10:07" },
    ]
  },
  {
    id: 6,
    roomId: 6,
    sender: "Stephen Hadley",
    message: "Hello!",
    time: "1 hr",
    usermessages: [
      { id: 1, to_id: 1, msg: "Good morning 😊", time: "10:00" },
      { id: 2, to_id: 2, msg: "Hi, How are you? What about our next meeting?", time: "10:02" },
      { id: 3, to_id: 1, msg: "Yeah everything is fine", time: "10:06" },
      { id: 4, to_id: 2, msg: "& Next meeting tomorrow 10.00AM", time: "10:06" },
    ]
  },
  {
    id: 7,
    roomId: 7,
    sender: "Keith Gonzales",
    message: "hyyy",
    time: "1 hr",
    usermessages: [
      { id: 1, to_id: 1, msg: "Good morning 😊", time: "10:00" },
      { id: 2, to_id: 2, msg: "Hi, How are you? What about our next meeting?", time: "10:02" },
      { id: 3, to_id: 1, msg: "Yeah everything is fine", time: "10:06" },
      { id: 4, to_id: 2, msg: "& Next meeting tomorrow 10.00AM", time: "10:06" },
      { id: 5, to_id: 1, msg: "Wow that's great", time: "10:07" },
    ]
  },
];

export { chats, messages, contacts, groups }
