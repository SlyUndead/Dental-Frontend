import React, { useState } from "react"
import PropTypes from 'prop-types'
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap"

//i18n
import { withTranslation } from "react-i18next"
// Redux
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom";
import withRouter from "components/Common/withRouter"
import sessionManager from "utils/sessionManager"
// users
import user1 from "../../../assets/images/users/user-1.jpg"

const ProfileMenu = props => {
  // Declare a new state variable, which we'll call "menu"
  const [menu, setMenu] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    // Remove token and other session data
    sessionManager.clearSession();
    // Navigate to login page
    navigate('/login')
  }

  return (
    <React.Fragment>
      <Dropdown
        isOpen={menu}
        toggle={() => setMenu(!menu)}
        className="d-inline-block"
      >
        <DropdownToggle
          className="btn header-item noti-icon waves-effect"
          id="page-header-user-dropdown"
          tag="button"
        >
          <i class="mdi mdi-account-circle" style={{height : "36px", weight : "36px"}}></i>
          {/* <img
            className="rounded-circle header-profile-user"
            src={user1}
            alt="Header Avatar"
          /> */}
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          <DropdownItem tag="a" href="/profile">
            {" "}
            <i className="mdi mdi-account-circle font-size-17 text-muted align-middle me-1"/>
            {props.t("Profile")}{" "}
          </DropdownItem>
          {/* <DropdownItem tag="a" href="#">
            <i className="mdi mdi-wallet font-size-17 text-muted align-middle me-1"/>
            {props.t("My Wallet")}
          </DropdownItem> */}
          <DropdownItem className="d-flex align-items-center" to="#">
            <i className="mdi mdi-cog font-size-17 text-muted align-middle me-1"></i>
            {props.t("Settings")}<span className="badge bg-success ms-auto">11</span></DropdownItem>
          <DropdownItem tag="a" href="auth-lock-screen">
            <i className="mdi mdi-lock-open-outline font-size-17 text-muted align-middle me-1"/>
            {props.t("Lock screen")}
          </DropdownItem>

          <div className="dropdown-divider"/>
          <DropdownItem className="text-danger" onClick={handleLogout}>
            <i className="mdi mdi-power font-size-17 text-muted align-middle me-1 text-danger"/>
            <span>{props.t("Logout")}</span>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </React.Fragment>
  )
}

ProfileMenu.propTypes = {
  success: PropTypes.any,
  t: PropTypes.any
}

const mapStatetoProps = state => {
  const { error, success } = state.Profile
  return { error, success }
}

export default withRouter(
  connect(mapStatetoProps, {})(withTranslation()(ProfileMenu))
)