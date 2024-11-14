//Import Images
import user1 from "../../assets/images/users/user-1.jpg"
import user2 from "../../assets/images/users/user-2.jpg"
import user3 from "../../assets/images/users/user-3.jpg"
import user4 from "../../assets/images/users/user-4.jpg"
import user5 from "../../assets/images/users/user-5.jpg"
import user6 from "../../assets/images/users/user-6.jpg"
import user7 from "../../assets/images/users/user-7.jpg"
import user8 from "../../assets/images/users/user-8.jpg"

import img1 from "../../assets/images/small/img-1.jpg";
import img2 from "../../assets/images/small/img-2.jpg";
import img3 from "../../assets/images/small/img-3.jpg";

import img4 from "../../assets/images/small/img-4.jpg";
import img5 from "../../assets/images/small/img-5.jpg";
import img6 from "../../assets/images/small/img-6.jpg";


const tasks = [
  {
    id: "1",
    name: "Upcoming",
    cards: [
      {
        id: "1",
        title: "Topnav layout design",
        date: "14 Oct, 2019",
        badgeText: "Waiting",
        badgeColor: "secondary",
        budget: "145",
        kanbanImgtextColor: "bg-info",
        kanbanImgtext: [{ id: 1, imageText: "3+" }],
        taskdesc: "create banbun board",
        userImages: [{ id: 4, img: user4 }, { id: 5, img: user5 }, { id: 2, img: user2 }],
      },
      {
        id: "2",
        title: "Create a New landing UI",
        date: "15 Oct, 2021",
        badgeText: "Approved",
        badgeColor: "primary",
        taskdesc: "Separate existence is a myth.",
        taskdesc1: "For music, sport, etc",
        budget: "112",
        imageTextColor: "bg-success",
        userImages: [{ id: 1, img: user1 }, { id: 2, img: user2 }, { id: 0, imageText: "A" }, { id: 5, img: user5 }],
        // taskdesc: "learning react"
      },
      {
        id: "3",
        title: "Create a Skote Logo",
        date: "15 Oct, 2019",
        badgeText: "Waiting",
        badgeColor: "secondary",
        budget: "86",
        imageTextColor: "bg-warning",
        kanbanImgtextColor: "bg-danger",
        kanbanImgtext: [{ id: 1, imageText: "9+" }],
        userImages: [{ id: 4, img: user4 }, { id: 0, imageText: "R" }, { id: 5, img: user5 }],
        taskdesc: "solved issue"
      },
    ],
  },
  {
    id: "4",
    name: "In Progress",
    cards: [
      {
        id: "5",
        title: "Brand logo design",
        date: "12 Oct, 2019",
        badgeText: "Complete",
        badgeColor: "success",
        budget: "132",
        userImages: [{ id: 7, img: user7 }, { id: 8, img: user8 }],
        brandLogo: [{ id: 1, img: img1 }, { id: 2, img: img2 }, { id: 3, img: img3 }],
        taskdesc: "design logo"
      },
      {
        id: "6",
        title: "Create a Blog Template UI",
        date: "13 Oct, 2019",
        badgeText: "Pending",
        badgeColor: "warning",
        budget: "103",
        imageTextColor: "bg-success",
        kanbanImgtextColor: "bg-info",
        kanbanImgtext: [{ id: 1, imageText: "3+" }],
        userImages: [{ id: 0, imageText: "A" }, { id: 6, img: user6 }, { id: 4, img: user4 }, { id: 7, img: user7 }],
        taskdesc: "Create a Blog "
      },
      {
        id: "7",
        title: "Create a Blog Template UI",
        date: "13 Oct, 2019",
        badgeText: "Pending",
        badgeColor: "warning",
        budget: "103",
        imageTextColor: "bg-success",
        kanbanImgtextColor: "bg-primary",
        kanbanImgtext: [{ id: 1, imageText: "7+" }],
        userImages: [{ id: 0, imageText: "A" }, { id: 4, img: user4 }, { id: 5, img: user5 }],
        taskdesc: "Create a Blog "
      },
    ],
  },
  {
    id: "8",
    name: "Completed",
    cards: [
      {
        id: "9",
        title: "Redesign - Landing page",
        date: "10 Oct, 2019",
        badgeText: "Complete",
        badgeColor: "success",
        // imageTextColor: "",
        budget: "145",
        imageTextColor: "bg-danger",
        userImages: [{ id: 1, img: user1 }, { id: 2, img: user2 }, { id: 0, imageText: "K" }, { id: 3, img: user3 }],
        taskdesc: "Redesign - Landing"
      },
      {
        id: "10",
        title: "Multipurpose Landing",
        date: "09 Oct, 2019",
        badgeText: "Complete",
        badgeColor: "success",
        budget: "92",
        kanbanImgtextColor: "bg-pink",
        kanbanImgtext: [{ id: 1, imageText: "5+" }],
        userImages: [{ id: 4, img: user4 }, { id: 5, img: user5 }, { id: 6, img: user6 }],
        brandLogo: [{ id: 1, imges: img4 }, { id: 2, imges: img5 }, { id: 3, imges: img6 }],
        taskdesc: "create a Multipurpose Landing"
      },
      {
        id: "11",
        title: "Skote landing Psd",
        date: "15 Oct, 2019",
        badgeText: "Waiting",
        badgeColor: "secondary",
        budget: "86",
        imageTextColor: "bg-danger",
        kanbanImgtextColor: "bg-info",
        kanbanImgtext: [{ id: 1, imageText: "2+" }],
        userImages: [{ id: 7, img: user7 }, { id: 8, img: user8 }, { id: 0, imageText: "D" },],
        taskdesc: "testing Skote landing"
      },
    ],
  }
]

const AddTeamMember = [
  { id: 1, img: user1, name: 'Albert Rodarte' },
  { id: 2, img: user2, name: 'Hannah Glover' },
  { id: 3, img: user3, name: 'Adrian Rodarte' },
  { id: 4, img: user4, name: 'Frank Hamilton' },
  { id: 5, img: user5, name: 'Justin Howard' },
  { id: 6, img: user6, name: 'Michael Lawrence' },
  { id: 7, img: user7, name: 'Oliver Sharp' },
  { id: 8, img: user8, name: 'Richard Simpson' }
]


export { tasks,AddTeamMember }
