import React, {  useState,useEffect } from 'react'
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, Label } from 'reactstrap';
import logoDark from "../../assets/images/logo-dark.png";
import logoLight from "../../assets/images/logo-dark.png";
// import { useSelector, useDispatch } from "react-redux";
// import { createSelector } from "reselect";
// import PropTypes, { resetWarningCache } from "prop-types";
import { Navigate } from "react-router-dom";
// Formik validation
//import * as Yup from "yup";
//import { useFormik } from "formik";
// import withRouter from 'components/Common/withRouter';
import { AvForm, AvField } from "availity-reactstrap-validation"
// actions
//import { loginUser, socialLogin, loginSuccess } from "../../store/actions";
import axios from "axios"
import { logErrorToServer } from '../../utils/logError';
const Login = props => {
  const apiUrl = process.env.REACT_APP_NODEAPIURL;
  document.title = "Login | AGP Dental Tool";
  const [redirect, setRedirect] = useState(false);
  //const dispatch = useDispatch();

  //create user
  // useEffect(() => {
  //   const createUser = async () => {
  //     const response = await axios.post(`${apiUrl}/user-register`, {
  //       first_name: 'Imaran', last_name: 'Qureshi', email: 'imran.qureshi@gmail.com', role: '671770529d3ce13d7fdae2db',
  //       password: 'Imaran@123', client_id: '6718e36c9d3ce13d7fdae2ee'
  //     });
  //     console.log(response);
  //   }
  //   createUser();
  // }, [])
  //-----------
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    //e.preventDefault();
    setError('');
      try {
        //console.log("calling api");
        const response = await axios.post(`${apiUrl}/login`, {
          username: username, password: password
        });
        // console.log(response);
        if (response.status === 200) {
          //console.log(response);
          sessionStorage.setItem('token', response.data.token);
          sessionStorage.setItem('clientId',response.data.clientId);
          sessionStorage.setItem('firstName', response.data.firstName);
          sessionStorage.setItem('lastName', response.data.lastName);
          // localStorage.setItem('authUser',response.data.token);
          setError('');          
          setRedirect(true);
        }
        else
          throw new Error(response.data || 'Login failed');
      }
      catch (error) {
        console.log(error);
        if (error instanceof Error) {
          setError(error?.response?.data || 'Login failed');
        } else {
          setError(process.env.REACT_APP_ERRORMSG);
        }
        await logErrorToServer(error,"handleSubmit");
      }
  }

  if (redirect) {
      return <Navigate to="/practiceList" />;
  }

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
                      <img src={logoDark} alt="" height="55" className="auth-logo-dark" />
                      <img src={logoLight} alt="" height="55" className="auth-logo-light" />
                    </Link>
                  </h3>

                  <div className="p-3">
                    <h4 className="text-muted font-size-18 mb-1 text-center">Welcome Back !</h4>
                    <p className="text-muted text-center">Sign in to continue to AGP Dental Tool.</p>
                    <AvForm
                      className="form-horizontal mt-4 needs-validation"
                      onValidSubmit={handleSubmit}
                    >
                      {error && <p style={{ color: 'red' }}>{error}</p>}
                      <div className="mb-3">
                        <Label htmlFor="validationCustom01">Username</Label>
                        <AvField
                          name="firstname"
                          placeholder="User name"
                          type="text"
                          errorMessage="Enter User Name"
                          className="form-control"
                          validate={{ required: { value: true } }}
                          id="validationCustom01"
                          onChange={(e) => setUsername(e.target.value)} 
                          value={username} 
                        />
                        {/* <Input
                          name="email"
                          className="form-control"
                          placeholder="Enter email"
                          type="email"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.email || ""}
                          invalid={
                            validation.touched.email && validation.errors.email ? true : false
                          }
                        />
                        {validation.touched.email && validation.errors.email ? (
                          <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                        ) : null} */}
                      </div>
                      <div className="mb-3">
                        <Label htmlFor="validationCustom02">Password</Label>
                        <AvField
                          name="password"
                          placeholder="Password"
                          type="password"
                          errorMessage="Enter Password"
                          className="form-control"
                          validate={{ required: { value: true } }}
                          id="validationCustom02"
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                        />
                        {/* <Input
                          name="password"
                          value={validation.values.password || ""}
                          type="password"
                          placeholder="Enter Password"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          invalid={
                            validation.touched.password && validation.errors.password ? true : false
                          }
                        />
                        {validation.touched.password && validation.errors.password ? (
                          <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                        ) : null} */}
                      </div>
                      <Row className="mb-3 mt-4">
                        <div className="col-6">
                          <div className="form-check">
                            <input type="checkbox" className="form-check-input" id="customControlInline" />
                            <label className="form-check-label" htmlFor="customControlInline">Remember me
                            </label>
                          </div>
                        </div>
                        <div className="col-6 text-end">
                          <button className="btn btn-primary w-md waves-effect waves-light" type="submit">Log In</button>
                        </div>
                      </Row>
                      <Row className="form-group mb-0">
                        <Link to="/forgot-password" className="text-muted"><i className="mdi mdi-lock"></i> Forgot your password?</Link>
                        {/* <div className="col-12 mt-4 d-flex justify-content-center">
                          <Link
                            to="#"
                            className="social-list-item bg-danger text-white border-danger"
                            onClick={e => {
                              e.preventDefault();
                              socialResponse("google");
                            }}
                          >
                            <i className="mdi mdi-google" />
                          </Link>
                        </div> */}
                      </Row>
                    </AvForm>
                  </div>
                </CardBody>
              </Card>

              <div className="mt-5 text-center">
                <p>Don't have an account ? <Link to="/register" className="text-primary"> Signup Now </Link></p>
                © {new Date().getFullYear()} <span className="d-none d-sm-inline-block"> - Crafted with <i className="mdi mdi-heart text-danger"></i> by AGP.</span>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

    </React.Fragment>
  )
}

export default Login;

// Login.propTypes = {
//   history: PropTypes.object,
// };
