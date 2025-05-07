import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, Form, Input, Button } from 'reactstrap';
import logoDark from "../../assets/images/logo-dark.png";
import logoLight from "../../assets/images/logo-light.png";
import logo3 from "../../assets/images/logo3.png"
import logo4 from "../../assets/images/logo4.png"
import logo5 from "../../assets/images/logo5.png"
import logo7 from "../../assets/images/logo7.png"
import logo8 from "../../assets/images/logo8.png"
import dentalLaser from "../../assets/images/PX/Dental Laser.png"
import surgicalMicroscope from "../../assets/images/PX/Surgical Microscope.png"
import dentalServices from "../../assets/images/PX/Dental Services.png"
import toothExtraction from "../../assets/images/PX/Tooth Extraction.png"
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        sessionStorage.setItem('clientId', response.data.clientId);
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
      await logErrorToServer(error, "handleSubmit");
    }
  }

  if (redirect) {
    return <Navigate to="/practiceList" />;
  }

  return (
    <React.Fragment>
      <div className="login-page d-flex align-items-center vh-100">
        <Container fluid>
          <Row className="justify-content-center">
            {/* Left Section - Logo & AI Dental Care */}
            <Col md={7} className="left-section d-flex flex-column justify-content-center text-blue">
              <div className="text-start">
                {/* Add Your Logo Here */}
                <img src={logo8} alt="Logo" className="mb-3" height="40%" width="100%" />
                <h2 className="mt-3" style={{ fontSize: '32px', marginLeft: '5%' }}>Smarter dental care, powered by AI wisdom.</h2><br />
                <p className="mt-2" style={{ fontSize: '28px', marginLeft: '5%' }}>Enhancing diagnostics, optimizing workflows, and improving patient outcomes with AI-driven solutions.</p><br />
                <ul className="list-unstyled" style={{ fontSize: '24px', marginLeft: '5%' }}>
                  <li><img src={dentalLaser} height="8%" width="8%"></img> <strong>Efficiency</strong> - Automating diagnostics, treatment planning, and workflows</li>
                  <li><img src={surgicalMicroscope} height="8%" width="8%" /> <strong>Accuracy</strong> - Reducing errors in dental assessments</li>
                  <li><img src={dentalServices} height="8%" width="8%" /> <strong>Seamless Integration</strong> - Embedding AI wisdom into dental workflows</li>
                  <li><img src={toothExtraction} height="8%" width="8%" /> <strong>Trust & Compliance</strong> - Ensuring transparency for dentists and insurers</li>
                </ul>
              </div>
            </Col>

            {/* Right Section - Login Form */}
            <Col md={5} className="d-flex align-items-center justify-content-center">
              <Card className="login-card shadow-lg p-4">
                <CardBody>
                  <h3 className="text-center">Sign in</h3>
                  <p className="text-muted text-center">
                    Don't have an account? <Link to="/signup" style={{ color: '#1b69b2' }}>Sign up</Link>
                  </p>
                  {error&&<p className="text-center" style={{color:'red'}}>{error}</p>}

                  <Form className="mt-3" onSubmit={(e) => handleSubmit(e)}>
                    <div className="mb-3">
                      <Input
                        name="email"
                        type="email"
                        value={username}
                        className="form-control"
                        placeholder="Enter email"
                        required
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>

                    <div className="mb-3">
                      <Input
                        name="password"
                        type="password"
                        value={password}
                        className="form-control"
                        placeholder="Enter Password"
                        required
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="form-check">
                        <input type="checkbox" className="form-check-input" id="rememberMe" />
                        <label className="form-check-label" htmlFor="rememberMe">Keep me logged in</label>
                      </div>
                      <Link to="/forgot-password" className="text-muted" style={{ color: '#1b69b2' }}>Forgot password?</Link>
                    </div>

                    <Button color="primary" block type='submit' style={{ backgroundColor: '#1b69b2' }}>Log in</Button>
                  </Form>

                  <div className="text-center mt-4">
                    <p className="text-muted">Or continue with</p>
                    <div className="d-flex justify-content-center">
                      <Button color="light" className="social-btn me-2">
                        <i className="mdi mdi-google"></i>
                      </Button>
                      <Button color="light" className="social-btn me-2">
                        <i className="mdi mdi-facebook"></i>
                      </Button>
                      <Button color="light" className="social-btn">
                        <i className="mdi mdi-apple"></i>
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>

            </Col>
          </Row>
        </Container>

        {/* Custom Styles */}
        <style>{`
        .login-page {
          background-color: white;
        }
        .left-section {
          background: white;
          height: 100vh;
          color: #1b69b2;
          text-align: center;
          padding: 40px;
        }
        .brand-logo-img {
          height: 100px;
          width: 300px;
        }
        .brand-logo {
          font-size: 32px;
          font-weight: bold;
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          border-radius: 10px;
          background-color: #D3D3D3;
        }
        .social-btn {
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          border-radius: 50%;
        }
      `}</style>
      </div>

    </React.Fragment>
  )
}

export default Login;

// Login.propTypes = {
//   history: PropTypes.object,
// };
