import React, { useEffect, useState, useRef } from 'react';
import { labelColors } from './constants';
import { Card, CardBody, Button, ListGroup, ListGroupItem, Row, Col, UncontrolledTooltip, PopoverBody, UncontrolledPopover, Input, InputGroup, InputGroupText } from 'reactstrap';
import axios from 'axios';
import { changeMode } from "../../store/actions"
import { useDispatch } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../assets/scss/custom/components/_popover.scss';
const AnnotationList = ({
  annotations,
  hiddenAnnotations,
  setHiddenAnnotations,
  deleteBox,
  setHoveredAnnotation,
  setSelectedAnnotation,
  selectedAnnotation,
  classCategories,
  setAnnotations
}) => {
  // Check if setHoveredAnnotation is a function, if not, use a no-op function
  const apiUrl = process.env.REACT_APP_NODEAPIURL;
  const [hideAllAnnotations, setHideAllAnnotations] = useState(false);
  const popoverRef = useRef(null);
  const handleHover = typeof setHoveredAnnotation === 'function'
    ? setHoveredAnnotation
    : () => { };
  const [popoverData, setPopoverData] = useState({});
  const [popoverOpen, setPopoverOpen] = useState(null); // Track which annotation's popover is open
  const [groupedAnnotations, setGroupedAnnotations] = useState({});
  const [hideGroup, setHideGroup] = useState({})
  // Group annotations by their category
  const handleAnnotationClick = async (anno, index) => {
    if (index !== popoverOpen) {
      try {
        // Fetch data from the API
        const response = await axios.get(`${apiUrl}/get-className?className=` + anno.label);
        // console.log(response.data)
        setPopoverData(response.data);
        setPopoverOpen(index);
        if (response.data === null) {
          setPopoverData({ description: "Please contact admin", className: "Data Missing" })
          setPopoverOpen(index);
        }
      } catch (err) {
        setPopoverData({ description: "unable to fetch data", className: "error" })
        setPopoverOpen(index);
        console.log('Error fetching className:', err);
      }
    }
    else {
      setPopoverOpen(null);
    }
  };
  const dispatch = useDispatch();
  const getYouTubeId = (url) => {
    if (!url) return null; // Return null if the URL is undefined or null
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?\n]+)/);
    return match ? match[1] : null;
  };
  const isCategoryHidden = (category) => {
    const categoryAnnotations = groupedAnnotations[category].map((anno) =>
      annotations.findIndex((a) => a === anno)
    );
    return categoryAnnotations.every((index) => hiddenAnnotations.includes(index));
  };
  const hideBox = (id) => {
    setHiddenAnnotations([...hiddenAnnotations, id]);
  };

  const unhideBox = (id) => {
    setHiddenAnnotations(hiddenAnnotations.filter(hid => hid !== id));
  };
  const hideCategory = (category) => {
    const annotationsToHide = groupedAnnotations[category].map((anno) => 
        annotations.findIndex(a => a === anno)
    );
    setHiddenAnnotations(prev => [...prev, ...annotationsToHide]);
};
  const unhideCategory = (category) => {
    const annotationsToUnhide = groupedAnnotations[category].map((anno) => 
        annotations.findIndex(a => a === anno)
    );
    setHiddenAnnotations(prev => prev.filter(index => !annotationsToUnhide.includes(index)));
  };
  const unhideAllBoxes = () => {
    setHiddenAnnotations([]);
  };
  const hideAllBoxes = () => {
    const allIndices = annotations.map((_, index) => index);
    setHiddenAnnotations(allIndices);
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
  useEffect(()=>{
    let updatedGroupedAnnotations={}
    let updatedHideGroups={}
    annotations.forEach(anno => {
      const category = classCategories[anno.label]; // Get category from label
      if (category) {
        if(updatedGroupedAnnotations[category]===undefined){
          updatedGroupedAnnotations[category]=[]
          updatedHideGroups[category]=false
        }
        updatedGroupedAnnotations[category].push(anno);
      } else {
        if(updatedGroupedAnnotations['Others']===undefined){
          updatedGroupedAnnotations['Others']=[]
          updatedHideGroups['Others']=false
        }
        updatedGroupedAnnotations['Others'].push(anno); // Add to 'Others' if no matching category
      }
    console.log(annotations,updatedGroupedAnnotations)
    setGroupedAnnotations(updatedGroupedAnnotations);
      setHideGroup(updatedHideGroups);
    });
  },[classCategories,annotations])
  useEffect(() => {
    hiddenAnnotations.length !== annotations.length ? setHideAllAnnotations(false) : setHideAllAnnotations(true);
    console.log(hiddenAnnotations)
    const updatedHideGroup = { ...hideGroup };
    Object.keys(groupedAnnotations).forEach((category) => {
      updatedHideGroup[category]=isCategoryHidden(category);
    });
    setHideGroup(updatedHideGroup);

  }, [hiddenAnnotations, annotations, groupedAnnotations]);
  return (
    <Card style={{ maxHeight: '100%', maxWidth: '100%', borderRight: '1px solid #ccc' }}>
      <CardBody>
        <Row>
          <Col md={8}><h5>Annotations ({annotations.length})</h5></Col>
          <Col md={4} style={{ justifyContent: 'right', alignItems: 'right', textAlign: 'right' }}>
            <button
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
                </UncontrolledTooltip>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
          <div>
    {/* Loop over each category */}
    {Object.keys(groupedAnnotations).map((category) => (
      <div key={category}>
        {/* Display the category name */}
        <h5>
          {category} 
          <button
            id={`btnHide${category}`}
            type="button"
            className="btn noti-icon"
            onClick={(e) => {
              e.stopPropagation();
              if (hideGroup[category]) {
                unhideCategory(category);
                setHideGroup(prev => ({ ...prev, [category]: false }));
              } else {
                hideCategory(category);
                setHideGroup(prev => ({ ...prev, [category]: true }));
              }
            }}
          >
            <i className={`ion ${hideGroup[category] ? 'ion-md-eye-off' : 'ion-md-eye'}`}></i>
          </button>
              {/* <UncontrolledTooltip placement="bottom" target={`btnHide${category}`}>
                {`${hideGroup[category] ? `Show ${category}` : `Hide ${category}`}`}
              </UncontrolledTooltip> */}
        </h5>
        
        <ListGroup flush>
          {/* Loop over each annotation in the current category */}
          {groupedAnnotations[category].map((anno, index) => {
            const globalIndex = annotations.findIndex(a => a === anno);
            console.log(groupedAnnotations)
            if(globalIndex!==-1){
            return(
            <ListGroupItem
              key={globalIndex}
              id={`annotation-${globalIndex}`}
              className="d-flex align-items-center justify-content-between list-group-item-hover"
              style={{
                cursor: 'pointer',
                paddingRight: '0',
                paddingLeft: '0',
                paddingTop: '0',
                paddingBottom: '0'
              }}
              onClick={(e) => { e.stopPropagation(); handleAnnotationClick(anno, globalIndex); }}
              onMouseEnter={() => handleHover(globalIndex)}
              onMouseLeave={() => handleHover(null)}
            >
              <span style={{ flexGrow: 1 }}>{anno.label}</span>
              <div className="d-flex">
                {/* Delete Button */}
                <button
                  id="btnRemove"
                  type="button"
                  style={{ cssText: 'padding: 2px !important', fontSize: '20px' }}
                  className="btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBox(globalIndex);
                  }}
                >
                  <i className="mdi mdi-trash-can"></i>
                </button>

                {/* Hide/Show Button */}
                  <button
                  id="btnHideShow"
                  type="button"
                  className="btn noti-icon"
                  onClick={(e) => {
                      e.stopPropagation();
                      hiddenAnnotations.includes(globalIndex)
                          ? unhideBox(globalIndex)
                          : hideBox(globalIndex);
                  }}
              >
                  <i className={`ion ${hiddenAnnotations.includes(globalIndex) ? 'ion-md-eye-off' : 'ion-md-eye'}`}></i>
              </button>

                {/* Edit Button */}
                <button
                  id="btnEdit"
                  type="button"
                  style={{ cssText: 'padding: 2px !important', fontSize: '20px' }}
                  className="btn"
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
                    trigger="click"
                    placement="bottom-start"
                    isOpen={popoverOpen === globalIndex} // Only open the popover for the clicked item
                    target={`annotation-${globalIndex}`}
                    innerRef={popoverRef}
                    toggle={() => setPopoverOpen(null)} // Close the popover on toggle
                    style={{  width: "550px"}}
                  >
                    {popoverData !== null ? <PopoverBody style={{ padding: '20px', width: '500px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
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
                            style={{ marginRight: '10px', marginBottom: '10px' }}
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
                            style={{ marginBottom: '10px' }}
                          ></iframe>
                        )}
                      </div>

                      {/* Thumbnails */}
                      <div className="d-flex">
                        {popoverData.thumbnail1 !== undefined ? <img src={`${apiUrl}/${popoverData.thumbnail1}`} alt="Thumbnail 1" style={{ width: '50%', height: 'auto', marginRight: '10px' }} /> : <></>}
                        {popoverData.thumbnail2 !== undefined ? <img src={`${apiUrl}/${popoverData.thumbnail2}`} alt="Thumbnail 2" style={{ width: '50%', height: 'auto', marginRight: '10px' }} /> : <></>}
                      </div>
                    </PopoverBody> : <></>}
                  </UncontrolledPopover>
                </ListGroupItem>
                )}})}
            </ListGroup>
            </div>
            ))}
            </div>
            </Col>
        </Row>
      </CardBody>
    </Card>
  );
};

export default AnnotationList;