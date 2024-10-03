// Component: CyberBox
// Design by: joydeep.roni@gmail.com
// Design Link: https://www.figma.com/community/file/1242587221411969492/cyberpunk-2077-ppt-template

import React from 'react';

function CyberBox({
  description,
  width = '850px',
  height = '160px',
  isDivide = true,
}) {
  return (
    <div
      style={{
        position: 'relative',
      }}
    >
      {isDivide ? (
        <div
          style={{
            left: '60px',
            position: 'absolute',
            width: '5px',
            height: '90%',
            background: '#5EF6FF',
            opacity: 0.3,
            flexShrink: 0,
          }}
        ></div>
      ) : (
        <></>
      )}

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
      >
        <g filter="url(#filter0_d_1_1891)">
          <path
            d="M4 0H845V132L838.5 139.5L833.5 146H4V141.5L7 139V76L4 73V0Z"
            fill="#5EF6FF"
            fillOpacity="0.1"
            shapeRendering="crispEdges"
          />
          <path
            d="M838.122 139.173L838.113 139.184L838.104 139.195L833.254 145.5H4.5V141.734L7.32009 139.384L7.5 139.234V139V76V75.7929L7.35355 75.6464L4.5 72.7929V0.5H844.5V131.813L838.122 139.173Z"
            stroke="#5EF6FF"
            strokeOpacity="0.3"
            shapeRendering="crispEdges"
          />
        </g>
        <defs>
          <filter
            id="filter0_d_1_1891"
            x="0"
            y="0"
            width={width}
            height={height}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_1_1891"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_1_1891"
              result="shape"
            />
          </filter>
        </defs>
        <text
          x="50%"
          y="25%"
          textAnchor="middle"
          fill="#5EF6FF"
          fontSize="16px"
          fontWeight="bold"
        >
          {description.split('\n').map((line, index) => (
            <tspan
              color="#5EF6FF"
              key={index}
              x="50%"
              dy={index === 0 ? 0 : '20px'}
            >
              {line}
            </tspan>
          ))}
        </text>
      </svg>
    </div>
  );
}

export default CyberBox;
