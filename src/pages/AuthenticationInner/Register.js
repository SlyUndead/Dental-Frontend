import React from "react"
// availity-reactstrap-validation
import { Link } from "react-router-dom"

import { Row, Col, CardBody, Card, Container, Form, Input } from "reactstrap"

// import images
import logoLightPng from "../../assets/images/logo-light.png"
import logoDark from "../../assets/images/logo-dark.png"

const Register = () => {
  document.title = "Register | Lexa - Responsive Bootstrap 5 Admin Dashboard";

  return (
    <React.Fragment>

      <div className="account-pages my-5 pt-sm-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6} xl={5}>
              <Card className="overflow-hidden">
                <CardBody className="pt-0">
                  <h3 className="text-center mt-5 mb-4">
                    <Link to="/" className="d-block auth-logo">
                      <img src={logoDark} alt="" height="30" className="auth-logo-dark" />
                      <img src={logoLightPng} alt="" height="30" className="auth-logo-light" />
                    </Link>
                  </h3>
                  <div className="p-3">
                    <h4 className="text-muted font-size-18 mb-1 text-center">Free Register</h4>
                    <p className="text-muted text-center">Get your free Lexa account now.</p>
                    <Form
                      className="form-horizontal mt-4"
                    >

                      <div className="mb-3">
                        <Input
                          id="email"
                          name="email"
                          label="Email"
                          className="form-control"
                          placeholder="Enter email"
                          type="email"
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <Input
                          name="username"
                          label="Username"
                          type="text"
                          required
                          placeholder="Enter username"
                        />
                      </div>
                      <div className="mb-3">
                        <Input
                          name="password"
                          label="Password"
                          type="password"
                          required
                          placeholder="Enter Password"
                        />
                      </div>

                      <div className="mb-3 row mt-4">
                        <div className="col-12 text-end">
                          <button className="btn btn-primary w-md waves-effect waves-light" type="submit">Register</button>
                        </div>
                      </div>

                      <div className="mb-0 row">
                        <div className="col-12 mt-4">
                          <p className="text-muted mb-0 font-size-14">By registering you agree to the Lexa <Link to="#" className="text-primary">Terms of Use</Link></p>
                        </div>
                      </div>
                    </Form>
                  </div>
                </CardBody>
              </Card>
              <div className="mt-5 text-center">
                <p>
                  Already have an account ?{" "}
                  <Link to="/pages-login" className="text-primary">
                    {" "}
                    Login
                  </Link>{" "}
                </p>
                <p>
                  © {new Date().getFullYear()} Lexa <span className="d-none d-sm-inline-block"> - Crafted with <i className="mdi mdi-heart text-danger"></i> by Themesbrand.</span>
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  )
}

export default Register
