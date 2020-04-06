import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';
import MaterialSlider from '@material-ui/core/Slider';

const GenericSlider = withStyles({
    root: {
        color: '#3a8589',
        height: 3,
        padding: '13px 0',
    },
    thumb: {
        height: 27,
        width: 27,
        backgroundColor: '#fff',
        border: '1px solid currentColor',
        marginTop: -12,
        marginLeft: -13,
        boxShadow: '#ebebeb 0px 2px 2px',
        '&:focus,&:hover,&$active': {
            boxShadow: '#ccc 0px 2px 3px 1px',
        },
        '& .bar': {
            // display: inline-block !important;
            height: 9,
            width: 1,
            backgroundColor: 'currentColor',
            marginLeft: 1,
            marginRight: 1,
        },
    },
    active: {},
    valueLabel: {
        left: 'calc(-50% + 4px)',
    },
    track: {
        height: 3,
    },
    rail: {
        color: '#d8d8d8',
        opacity: 1,
        height: 3,
    },
})(MaterialSlider);

class Slider extends Component {
    state = {}
    render() {
        return (
            <GenericSlider
                valueLabelDisplay="auto"
                max={1440}
                valueLabelFormat={(a) => { return ~~(a / 60) }}
                step={30}
                defaultValue={[20, 40]}
            />
        );
    }
}

export default Slider;