import PropTypes from 'prop-types'
import React, { useEffect,useState } from "react"
import { connect } from "react-redux"
import withRouter from 'components/Common/withRouter';
import { Container } from "reactstrap";

import {
  changeLayout,
  changeTopbarTheme,
  changeLayoutWidth,
  changeColor,
  showRightSidebarAction,
  changeMode
} from "../../store/actions"

import Header from "./Header"
import Breadcrumb from "../../components/Common/Breadcrumb";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Rightbar from "../CommonForBoth/Rightbar"

import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import { useLocation } from 'react-router-dom';

const Layout = (props) => {
  const dispatch = useDispatch();
  const selectLayoutState = (state) => state.Layout;

  const selectLayoutProperties = createSelector(
    selectLayoutState,
    (layout) => ({
      topbarTheme: layout.topbarTheme,
      layoutWidth: layout.layoutWidth,
      layoutColor: layout.layoutColor,
      layoutMode:layout.layoutMode
    })
  );
  const {
    topbarTheme,
    layoutWidth,
    layoutColor,
    layoutMode
  } = useSelector(selectLayoutProperties);

  const pathName = useLocation();

  useEffect(() => {
    const title = pathName.pathname;
    let currentage = title.charAt(1).toUpperCase() + title.slice(2);

    document.title =
      currentage + " | AGP Dental Tool";
  }, [pathName.pathname]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  //hides right sidebar on body click
  useEffect(() => {
    const hideRightbar = (event) => {
      var rightbar = document.getElementById("right-bar");
      //if clicked in inside right bar, then do nothing
      if (rightbar && rightbar.contains(event.target)) {
        return;
      } else {
        //if clicked in outside of rightbar then fire action for hide rightbar
        dispatch(showRightSidebarAction(false));
      }
    };
  
    //init body click event fot toggle rightbar
    document.body.addEventListener("click", hideRightbar, true);
  
    // Cleanup the event listener on component unmount
    return () => {
      document.body.removeEventListener("click", hideRightbar, true);
    };
  }, [dispatch]); 

  /*
  layout settings
  */
  useEffect(() => {
    dispatch(changeLayout("horizontal"));
  }, [dispatch]);

  useEffect(() => {
    if (topbarTheme) {
      dispatch(changeTopbarTheme(topbarTheme));
    }
  }, [topbarTheme, dispatch]);

  useEffect(() => {
    if (layoutColor) {
      dispatch(changeColor(layoutColor));
    }
  }, [layoutColor, dispatch])

  useEffect(() => {
    if (layoutMode) {
      dispatch(changeMode(layoutMode));
    }
  }, [layoutMode, dispatch]);

  useEffect(() => {
    if (layoutWidth) {
      dispatch(changeLayoutWidth(layoutWidth));
    }
  }, [layoutWidth, dispatch]);

  const [isMenuOpened, setIsMenuOpened] = useState(false);
  const openMenu = () => {
    setIsMenuOpened(!isMenuOpened);
  };


    return (
      <React.Fragment>
        {/* <div id="preloader">
          <div id="status">
            <div className="spinner-chase">
              <div className="chase-dot"></div>
              <div className="chase-dot"></div>
              <div className="chase-dot"></div>
              <div className="chase-dot"></div>
              <div className="chase-dot"></div>
              <div className="chase-dot"></div>
            </div>
          </div>
        </div> */}

        <div id="layout-wrapper">
          <header id="page-topbar">
            <Header theme={topbarTheme}
                    isMenuOpened={isMenuOpened}
                    openLeftMenuCallBack={openMenu} 
                    />
            <div className="top-navigation">
              <div className="page-title-content">
                <Container fluid>
                  <Breadcrumb />
                </Container>
              </div>
              <Navbar menuOpen={isMenuOpened}/>
            </div>
          </header>
          <div className="main-content">
            <div className="page-content">
              <Container fluid>
                {props.children}
                <Footer />
              </Container>
            </div>
          </div>
        </div>
        {props.showRightSidebar ? <Rightbar /> : null}
      </React.Fragment>
    )
  }


Layout.propTypes = {
  changeLayout: PropTypes.func,
  changeLayoutWidth: PropTypes.func,
  changeTopbarTheme: PropTypes.func,
  changeMode:PropTypes.func,
  children: PropTypes.object,
  isPreloader: PropTypes.any,
  layoutWidth: PropTypes.any,
  location: PropTypes.object,
  showRightSidebar: PropTypes.any,
  topbarTheme: PropTypes.any
}

const mapStatetoProps = state => {
  return {
    ...state.Layout,
  }
}
export default connect(mapStatetoProps, {
  changeTopbarTheme,
  changeLayout,
  changeLayoutWidth,
  changeMode,
})(withRouter(Layout))
