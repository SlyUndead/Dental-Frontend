import React, { useEffect } from "react"

import {
  Alert,
  Col,
  Row,
  Card,
  CardBody,
  CardTitle,
  UncontrolledAlert,
} from "reactstrap"
import { Link } from "react-router-dom"

import { connect } from "react-redux";

//Import Action to copy breadcrumb items from local state to redux state
import { setBreadcrumbItems } from "../../store/actions";

const UiAlert = (props) => {
  document.title = "Alerts | Lexa - Responsive Bootstrap 5 Admin Dashboard";

  const breadcrumbItems = [
    { title: "Lexa", link: "#" },
    { title: "UI Elements", link: "#" },
    { title: "Alerts", link: "#" },
  ]

  useEffect(() => {
    props.setBreadcrumbItems('Alerts', breadcrumbItems)
  })

  return (
    <React.Fragment>

      <Row>
        <Col xl={6}>
          <Card>
            <CardBody>
              <CardTitle className="h4">Examples </CardTitle>
              <p className="card-title-desc">
                Alerts are available for any length of
                text, as well as an optional dismiss button. For proper styling, use one
                of the four <strong>required</strong> contextual classes (e.g., <code
                >.alert-success</code>). For inline dismissal, use the alerts jQuery plugin.
              </p>

              <div className="">
                <Alert color="success">
                  <strong>Well done!</strong> You successfully read this important alert message.
                </Alert>
                <Alert color="info" role="alert">
                  <strong>Heads up!</strong> This alert needs your attention, but it's not super important.
                </Alert>
                <Alert color="warning" role="alert">
                  <strong>Warning!</strong> Better check yourself, you're not looking too good.
                </Alert>
                <Alert color="danger" role="alert" className="mb-0">
                  <strong>Oh snap!</strong> Change a few things up and try submitting again.
                </Alert>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardBody>
              <CardTitle className="h4">Link color </CardTitle>
              <p className="card-title-desc">
                Use the{" "}
                <code className="highlighter-rouge">.alert-link</code>{" "}
                utility className to quickly provide matching colored links
                within any alert.
              </p>

              <div className="">
                <Alert color="success">
                  <strong>Well done!</strong> You successfully read <Link to="#" className="alert-link">this important alert message</Link>.
                </Alert>
                <Alert color="info">
                  <strong>Heads up!</strong> This <Link to="#" className="alert-link">alert needs your attention</Link>, but it's not super important.
                </Alert>
                <Alert colr="warning">
                  <strong>Warning!</strong> Better check yourself, you're <Link to="#" className="alert-link">not looking too good</Link>.
                </Alert>
                <Alert color="danger" className="mb-0">
                  <strong>Oh snap!</strong> <Link to="#" className="alert-link">Change a few things up</Link> and try submitting again.
                </Alert>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardBody>
              <CardTitle className="h4">Dismissing </CardTitle>
              <p className="card-title-desc">
                Add a dismiss button and the <code>.alert-dismissible</code> className, which adds extra padding
                to the right of the alert and positions the <code>.btn-close</code> button.
              </p>

              <div className="">
                <UncontrolledAlert color="success">
                  <strong>Well done!</strong> You successfully read this important alert message.
                </UncontrolledAlert>
                <UncontrolledAlert color="info" role="alert">
                  <strong>Heads up!</strong> This alert needs your attention, but it's not super important.
                </UncontrolledAlert>
                <UncontrolledAlert color="warning" role="alert">
                  <strong>Warning!</strong> Better check yourself, you're not looking too good.
                </UncontrolledAlert>
                <UncontrolledAlert color="danger" role="alert" className="mb-0">
                  <strong>Oh snap!</strong> Change a few things up and try submitting again.
                </UncontrolledAlert>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardBody>
              <CardTitle className="h4">Additional content </CardTitle>
              <p className="card-title-desc">Alerts can also contain additional HTML elements like headings and paragraphs.</p>

              <div className="">
                <Alert color="success" className="mb-0" >
                  <h4 className="alert-heading font-size-18">Well done!</h4>
                  <p>Aww yeah, you successfully read this important alert message. This example text is going to run a bit longer so that you can see how spacing within an alert works with this kind of content.</p>
                  <p className="mb-0">Whenever you need to, be sure to use margin utilities to keep things nice and tidy.</p>
                </Alert>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col xl={6}>
          <Card>
            <CardBody>

              <CardTitle className="h4">Examples</CardTitle>
              <p className="card-title-desc">Alerts are available for any length of text, as well as an optional dismiss button. For proper styling, use one of the four <strong>required</strong> contextual classNamees (e.g., <code className="highlighter-rouge">.alert-success .bg-**</code>). For inline dismissal, use the alerts jQuery plugin.</p>

              <div className="">
                <Alert color="success" className="bg-success text-white" >
                  <strong>Well done!</strong> You successfully read this important alert message.
                </Alert>
                <Alert color="info" className="bg-info text-white" >
                  <strong>Heads up!</strong> This alert needs your attention, but it's not super important.
                </Alert>
                <Alert color="warning" className="bg-warning text-white" >
                  <strong>Warning!</strong> Better check yourself, you're not looking too good.
                </Alert>
                <Alert color="danger" className="bg-danger text-white mb-0" >
                  <strong>Oh snap!</strong> Change a few things up and try submitting again.
                </Alert>
              </div>
            </CardBody>
          </Card>

        </Col>

        <Col xl={6}>
          <Card>
            <CardBody>
              <h4 className="card-title">Alert Examples</h4>

              <div className="">
                <Row>
                  <Col sm={6}>
                    <Alert color="success" className="alert-dismissible fade show mt-4 px-4 mb-0 text-center" role="alert">
                      <i className="mdi mdi-check-circle-outline d-block display-4 mt-2 mb-3 text-success"></i>
                      <h5 className="text-success">Success</h5>
                      <p>A simple success alert</p>
                      <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close">

                      </button>
                    </Alert>
                  </Col>

                  <Col sm={6}>
                    <Alert color="danger" className="alert-dismissible fade show mt-4 px-4 mb-0 text-center" role="alert">
                      <i className="mdi mdi-alert-octagon-outline d-block display-4 mt-2 mb-3 text-danger"></i>
                      <h5 className="text-danger">Error</h5>
                      <p>A simple danger alert</p>
                      <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close">
                      </button>
                    </Alert>
                  </Col>

                </Row>
              </div>

            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h4 className="card-title">Live Example</h4>
              <p className="card-title-desc">Click the button below to show an alert (hidden with inline styles to start), then dismiss (and destroy) it with the built-in close button.</p>

              <div className="">
                <div id="liveAlertPlaceholder"></div>
                <button type="button" className="btn btn-primary" id="liveAlertBtn">Show live alert</button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

    </React.Fragment>
  )
}

export default connect(null, { setBreadcrumbItems })(UiAlert);