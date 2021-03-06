/**
 * 404页面
 */

import React from 'react'
import styled from 'styled-components'

export default () => {
  return (
    <NotFound>
      <div className="inner">
        <div />
        <p>当前页面未找到</p>
      </div>
    </NotFound>
  )
}

const NotFound = styled.div`
  .inner {
    text-align: center;
    & > div {
      margin: 100px auto 20px;
      width: 120px;
      height: 120px;
      background-image: url(${require('./not_found.png')});
      background-size: contain;
      background-repeat: no-repeat;
    }
    p {
      font-size: 16px;
    }
  }
`
