import React, { useEffect, useState, useRef } from 'react';
import { labelColors } from './constants';
import { Card, CardBody, Button, ListGroup, ListGroupItem, Row, Col, UncontrolledTooltip, PopoverBody, UncontrolledPopover, Input, InputGroup, InputGroupText } from 'reactstrap';
import axios from 'axios';
import { changeMode } from "../../store/actions"
import { useDispatch } from 'react-redux';
const AnnotationList = ({
  annotations,
  hiddenAnnotations,
  deleteBox,
  hideBox,
  unhideBox,
  setHoveredAnnotation,
  setSelectedAnnotation,
  selectedAnnotation,
  unhideAllBoxes,
  hideAllBoxes,
  showBoundingBox,
  showSegmentation,
  setShowBoundingBox,
  setShowSegmentation,
  model
}) => {
  // Check if setHoveredAnnotation is a function, if not, use a no-op function
  const [hideAllAnnotations, setHideAllAnnotations] = useState(false);
  const popoverRef = useRef(null);
  const handleHover = typeof setHoveredAnnotation === 'function'
    ? setHoveredAnnotation
    : () => { };
    const [popoverData, setPopoverData] = useState({});
    const [popoverOpen, setPopoverOpen] = useState(null); // Track which annotation's popover is open
  
    const handleAnnotationClick = async (anno,index) => {
      if(index!==popoverOpen){
        try {
        // Fetch data from the API
        const response = await axios.get('https://agp-ui-node-api.mdbgo.io/get-className?className='+anno.label);
        // console.log(response.data)
        setPopoverData(response.data);
        setPopoverOpen(index);
        if(response.data===null){
          setPopoverData({description:"Please contact admin",className:"Data Missing"})
          setPopoverOpen(index);
        }
      } catch (err) {
        setPopoverData({description:"unable to fetch data",className:"error"})
        setPopoverOpen(index);
        console.log('Error fetching className:', err);
      }
      }
      else{
        setPopoverOpen(null);
      }
    };
  const dispatch = useDispatch();
  const getYouTubeId = (url) => {
    if (!url) return null; // Return null if the URL is undefined or null
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?\n]+)/);
    return match ? match[1] : null;
  };
  
  useEffect(() => {
    dispatch(changeMode('dark'));
  }, []);
  const handleClickOutside = (event) => {
    if (popoverRef.current && !popoverRef.current.contains(event.target)) {
      setPopoverOpen(null);
    }
  };
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  useEffect(() => {
    hiddenAnnotations.length !== annotations.length ? setHideAllAnnotations(false) : setHideAllAnnotations(true);
  }, [hiddenAnnotations, annotations]);
  return (
    <Card style={{ maxHeight: '100%', maxWidth: '100%', borderRight: '1px solid #ccc' }}>
      <CardBody>
        <Row>
          <Col md={6}><h5>Annotations ({annotations.length})</h5></Col>
          <Col md={6} style={{ justifyContent: 'right', alignItems: 'right', textAlign: 'right' }}>
          {model==="segmentation"?
              <InputGroup>
                  <InputGroupText style={{ marginLeft: '10px' }}>Box:</InputGroupText>
                    <button
                      id="btnBoxShowAll"
                      type="button"
                      style={{
                        cssText: 'padding: 2px !important',
                      }}
                      className="btn noti-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowBoundingBox(!showBoundingBox)
                      }}
                    >
                      <i className={`ion ${showBoundingBox ? 'ion-md-eye-off' : 'ion-md-eye'}`}></i>
                    </button>
                    <InputGroupText style={{ marginLeft: '10px' }}>Seg:</InputGroupText>
                    <button
                      id="btnSegShowAll"
                      type="button"
                      style={{
                        cssText: 'padding: 2px !important',
                      }}
                      className="btn noti-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSegmentation(!showSegmentation)
                      }}
                    >
                      <i className={`ion ${showSegmentation ? 'ion-md-eye-off' : 'ion-md-eye'}`}></i>
                    </button>
                  </InputGroup>
                  :<><button
              id="btnHideShowAll"
              type="button"
              style={{
                cssText: 'padding: 2px !important',
              }}
              className="btn noti-icon"
              onClick={(e) => {
                e.stopPropagation();
                if (hideAllAnnotations) {
                  unhideAllBoxes();
                  setHideAllAnnotations(false);
                } else {
                  hideAllBoxes();
                  setHideAllAnnotations(true);
                }
              }}
            >
              <i className={`ion ${hideAllAnnotations ? 'ion-md-eye-off' : 'ion-md-eye'}`}></i>
            </button> 
             <UncontrolledTooltip placement="bottom" target="btnHideShowAll">
              {`${hideAllAnnotations ? 'Show All' : 'Hide All'}`}
            </UncontrolledTooltip></>}
          </Col>
        </Row>
        <Row>
          <Col md={12}>
          
        <ListGroup flush>
      {annotations.map((anno, index) => (
        <ListGroupItem
          key={index}
          id={`annotation-${index}`} // Unique id for the popover target
          className="d-flex align-items-center justify-content-between"
          style={{
            cursor: 'pointer',
             paddingRight: '0',
              paddingLeft: '0'
          }}
          onClick={(e) =>{e.stopPropagation(); handleAnnotationClick(anno,index)}} // Fetch and show popover
          onMouseEnter={() => handleHover(index)}
          onMouseLeave={() => handleHover(null)}
        >
          <span style={{ flexGrow: 1 }}>{anno.label}</span>
          <div className="d-flex">
            {/* Delete Button */}
            <button
              id="btnRemove"
              type="button"
              style={{ cssText: 'padding: 2px !important' }}
              className="btn noti-icon"
              onClick={(e) => {
                e.stopPropagation();
                deleteBox(index);
              }}
            >
              <i className="mdi mdi-trash-can"></i>
            </button>

            {/* Hide/Show Button */}
            <button
              id="btnHideShow"
              type="button"
              style={{ cssText: 'padding: 2px !important' }}
              className="btn noti-icon"
              onClick={(e) => {
                e.stopPropagation();
                hiddenAnnotations.includes(index) ? unhideBox(index) : hideBox(index);
              }}
            >
              <i className={`ion ${hiddenAnnotations.includes(index) ? 'ion-md-eye-off' : 'ion-md-eye'}`}></i>
            </button>

            {/* Edit Button */}
            <button
              id="btnEdit"
              type="button"
              style={{ cssText: 'padding: 2px !important' }}
              className="btn noti-icon"
              onClick={(e) => {
                e.stopPropagation();
                selectedAnnotation === anno ? setSelectedAnnotation(null) : setSelectedAnnotation(anno);
              }}
            >
              <i className={`mdi ${selectedAnnotation === anno ? 'mdi-lead-pencil' : 'mdi-pencil-box-outline'}`}></i>
            </button>
          </div>

          {/* Popover with Class Details */}
          <UncontrolledPopover
            trigger="focus"
            placement="right"
            isOpen={popoverOpen === index} // Only open the popover for the clicked item
            target={`annotation-${index}`}
            innerRef={popoverRef}
            toggle={() => setPopoverOpen(null)} // Close the popover on toggle
          >
            {popoverData!==null?<PopoverBody>
              {/* Display the fetched data */}
              <h5>{popoverData.className}</h5>
              <p>{popoverData.description}</p>

              {/* YouTube Thumbnails (direct URLs from the API) */}
              <div className="d-flex">
                  {getYouTubeId(popoverData.yt_url1) && (
                    <iframe
                      width="50%"
                      height='auto'
                      src={`https://www.youtube.com/embed/${getYouTubeId(popoverData.yt_url1)}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="YouTube Video 1"
                      style={{ marginRight: '10px', marginBottom:'10px' }}
                    ></iframe>
                  )}
                  {getYouTubeId(popoverData.yt_url2) && (
                    <iframe
                      width="50%"
                      height='auto'
                      src={`https://www.youtube.com/embed/${getYouTubeId(popoverData.yt_url2)}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="YouTube Video 2"
                      style={{marginBottom:'10px'}}
                    ></iframe>
                  )}
                </div>

              {/* Thumbnails */}
              <div className="d-flex">
                {popoverData.thumbnail1!==undefined?<img src={`https://agp-ui-node-api.mdbgo.io/${popoverData.thumbnail1}`} alt="Thumbnail 1" style={{ width: '50%', height: 'auto', marginRight: '10px' }} />:<></>}
                {popoverData.thumbnail2!==undefined?<img src={`https://agp-ui-node-api.mdbgo.io/${popoverData.thumbnail2}`} alt="Thumbnail 2" style={{ width: '50%', height: 'auto', marginRight: '10px' }} />:<></>}
              </div>
            </PopoverBody>:<></>}
          </UncontrolledPopover>
        </ListGroupItem>
      ))}
        </ListGroup>
        </Col>
        </Row>
      </CardBody>
    </Card>
  );
};

export default AnnotationList;