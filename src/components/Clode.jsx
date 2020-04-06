import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react'

class Clode extends Component {
    state = {
        allowDropdown: false
    }
    constructor() {
        super()
        this.myRef = React.createRef();
    }

    render() {
        return (
            <Dropdown
                ref={this.myRef}
                button
                clearable
                item
                fluid
                placeholder='Search...'
                multiple
                selection
                floating
                labeled
                defaultOpen={false}
                className='icon'
                icon='book'
                openOnFocus={false}
                closeOnChange={true}
                search={this.handleSearch}
                onSearchChange={this.handleSearchChange}
                onChange={this.handleItemAdd}
                onClick={this.handleClick}
                value={this.props.values}
                noResultsMessage={this.getResultsMessage()}
                options={this.options()}
                lazyLoad={true}
            />
        );
    }

    getResultsMessage = () => {
        if (!this.canAddClasses()) return "Maximum number of classes reached";
        if (!this.state.allowDropdown) return <p>Start typing a course name (i.e. <code>ECE 100</code>)</p>
        return "No classes found";
    }

    canAddClasses = () => {
        return this.props.values.length < this.props.maxClasses
    }

    handleItemAdd = (event, clode) => {
        this.props.handleValueChange(clode.value);
        this.setState({ allowDropdown: false })
    }

    handleSearchChange = (a, b) => {
        if (b.searchQuery.length > 0 && !this.state.allowDropdown) this.setState({ allowDropdown: true })
        else if (b.searchQuery.length === 0) this.setState({ allowDropdown: false })
    }

    handleSearch = (list, query) => {
        if (!this.canAddClasses()) return [];
        query = query.toUpperCase();
        const newList = list.filter(item => item.text.startsWith(query)).slice(0, 5);
        return newList;
    }

    options = () => {
        if (!this.state.allowDropdown) return this.props.values.map(v => {
            return { text: v, value: v }
        });
        // console.log(this.state.query, /OPTIONQUERY/)
        let options = [];
        for (let name of this.props.allClasses) {
            options.push({ text: name, value: name })
        }
        return options;
    }
}

export default Clode;