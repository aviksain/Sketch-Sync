export const drawLine = ({
  prevPoint,
  currentPoint,
  ctx,
  color,
  lineWidth
}) => {

  console.log("Draw-line");
  const { x: currX, y: currY } = currentPoint;
  const lineColor = color;
  let startPoint = prevPoint || currentPoint;
  ctx.beginPath(); // begins a new path without connecting the older paths
  ctx.lineWidth = lineWidth; // the drawing line width
  ctx.strokeStyle = lineColor; // the drawing line color
  ctx.lineJoin = "round"; // sets the style of the corners where lines meet to be rounded.
  ctx.lineCap = "round"; // sets the style of the ends of lines to be rounded.

  // moves the starting point of a new sub-path to the specified coordinates (startPoint.x, startPoint.y) without drawing anything
  ctx.moveTo(startPoint.x, startPoint.y);

  ctx.lineTo(currX, currY); // adds a straight line to the current sub-path from the current drawing cursor position to the coordinates specified by currX and currY.
  ctx.stroke(); // the current sub-path with the color and width previously set.

  ctx.fillStyle = lineColor; // color of the points
  ctx.beginPath();
  ctx.arc(startPoint.x, startPoint.y, 2, 0, 2 * Math.PI); // adds an arc to the current sub-path, centered at the coordinates specified by startPoint.x and startPoint.y, with a radius of 2 units, starting angle of 0 radians, and ending angle of 2 * Math.PI (which represents a full circle).
  ctx.fill(); // fills the current sub-path (in this case, the arc) with the current fill color.
};
