import React, { Component } from 'react';
import Navigation from "./Navigation"
import Calendar from './Calendar';
import { Segment, Container } from "semantic-ui-react"
class App extends Component {
    state = {
        values: [],
        loadedCourses: {}, // {"ECE 100": {...data}, ... }
        calendarLoading: true
    }
    render() {
        return (
            <React.Fragment>
                <Navigation
                    values={this.state.values}
                    handleValueChange={(values) => this.setState({ values, calendarLoading: true })}
                ></Navigation>
                <Container style={{ width: "100%" }}>
                    <Segment style={{ width: "80%", margin: "0 auto", overflowY: "scroll" }} compact loading={this.state.calendarLoading}>
                        <Calendar
                            finishedLoading={this.onLoadingFinished}
                            values={this.state.values}
                            loadedCourses={this.state.loadedCourses}
                            handleCourseLoad={this.onCoursesLoad}
                            loading={this.state.calendarLoading}
                        ></Calendar>
                    </Segment>
                </Container>
            </React.Fragment >
        );
    }

    onLoadingFinished = () => {
        this.setState({ calendarLoading: false })
    }

    onCoursesLoad = (loadedCourses) => {
        this.setState({ loadedCourses })
    }
}

export default App;