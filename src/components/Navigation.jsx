import React, { Component } from 'react';
// import { ProgressBar } from 'react-bootstrap';
import Clode from "./Clode"
import json from "../json/allClasses.json"
import { Header, Container, Image, Divider, Segment } from "semantic-ui-react"

class Navigation extends Component {
    render() {
        return (
            <Header>
                <Segment inverted attached="top">
                    <Header textAlign="center">
                        <Image inline size="mini" centered circular src="favicon.ico" /> IIT Schedule Generator
                    <Divider hidden></Divider>
                        <Container>
                            <Clode
                                values={this.props.values}
                                handleValueChange={this.props.handleValueChange}
                                allClasses={json}
                                maxClasses={10}
                                key="clode"
                            />
                        </Container>
                    </Header>
                </Segment>
            </Header>
        );
    }
}

export default Navigation;