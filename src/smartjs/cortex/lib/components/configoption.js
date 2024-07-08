export class ConfigOption extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = {
            value: ( props.type == OptionType.BOOL ) ? props.value == "true" : props.value
        };
    }

    change ( value ) {
        this.setState( {
            value
        } );

        if ( this.props.onChange ) {
            this.props.onChange( value );
        }
    }

    render () {
        let input;

        if ( this.props.type == OptionType.BOOL ) {
            input = React.createElement(
                "div",
                {
                    style: {
                        width: "33%",
                        float: "right"
                    }
                },
                React.createElement(
                    "input",
                    {
                        class: "smartjs-checkbox",
                        type: "checkbox",
                        checked: this.state.value
                    }
                ),
                React.createElement(
                    "span",
                    {
                        class: "smartjs-checkbox",
                        onClick: () => this.change( this.state.value ? "false" : "true" )
                    }
                )
            );
        } else if ( this.props.type == OptionType.STR ||
                    this.props.type == OptionType.INT ||
                    this.props.type == OptionType.FLOAT ||
                    this.props.type == OptionType.ARR ||
                    this.props.type instanceof OptionType.ENUM ) {
            let value;

            if ( this.props.type instanceof OptionType.ENUM ) {
                value = this.props.labels.byKeys()[ this.props.value ];
            }

            input = React.createElement(
                "input",
                {
                    class: "smartjs-input",
                    style: {
                        float: "right",
                        width: "33%"
                    },
                    type: "text",
                    spellcheck: "false",
                    value: value || this.state.value,
                    onChange: e => this.change( e.target.value ),
                    onKeyDown: e => e.stopPropagation()
                }
            );
        } else {
            //
        }

        return React.createElement(
            "li",
            {
                style: {
                    margin: "10px 0 0 0"
                }
            },
            React.createElement(
                "div",
                {},
                React.createElement(
                    "h4",
                    {
                        style: {
                            margin: 0,
                            padding: 0,
                            display: "inline-block"
                        }
                    },
                    typeof this.props.label == 'undefined' ? this.props.optkey : this.props.label
                ),
                input
            ),
            React.createElement(
                "div",
                {
                    style: {
                        fontSize: "0.8rem",
                        width: "60%"
                    }
                },
                this.props.description || "No description"
            ),
        );
    }
}