/** @file React component to view and edit module config options. */

import "/smartjs/environment";

import { ConfigOption } from "/smartjs/lib/ui/components/configoption";

export class ConfigTab extends React.Component {
    constructor( props ) {
        super( props );
        this.state = {};
    }

    convertOptions( options ) {
        let newOptions = [];

        for ( let i = 0; i < options.length; i++ ) {
            let value;

            if ( typeof options[i].value != 'undefined' ) {
                if ( options[i].type == OptionType.ARR && options[i].value.length > 0 ) {
                    value = options[i].value.reduce(
                        ( prev, cur ) => {
                            if ( prev != "" ) {
                                return `${prev}${options[i].delimiter}${cur}`;
                            }

                            return cur;
                        }
                    );
                } else {
                    value = options[i].value.toString();
                }
            } else {
                value = ""
            }

            newOptions[i] = {
                key: options[i].key,
                type: options[i].type,
                initial: options[i].initial,
                value,
                label: options[i].label,
                description: options[i].description,
                labels: options[i].labels
            };
        }

        return newOptions;
    }

    render() {
        if ( !this.state.options ) {
            this.setState( {
                options: this.convertOptions( this.props.data.options )
            } );

            return React.createElement("div");
        }

        let items = [];

        for ( let i = 0; i < this.state.options.length; i++ ) {
            items.push(
                React.createElement(
                    ConfigOption,
                    {
                        optkey: this.state.options[i].key,
                        type: this.state.options[i].type,
                        initial: this.state.options[i].initial,
                        value: this.state.options[i].value,
                        delimiter: this.state.options[i].delimiter,
                        label: this.state.options[i].label,
                        description: this.state.options[i].description,
                        labels: this.state.options[i].labels,
                        onChange: value => this.setState( prev => {
                            prev.options[i].value = value.toString();

                            return prev;
                        } )
                    }
                )
            );
        }

        return React.createElement(
            "div",
            {
                class: "smartjs-scrollable",
                style: {
                    maxWidth: "900px",
                    maxHeight: "500px"
                }
            },
            React.createElement(
                "ul",
                {
                    style: {
                        margin: 0,
                        padding: 0,
                        width: "85%",
                        "list-style-type": "none"
                    }
                },
                items
            ),
            React.createElement(
                "button",
                {
                    class: "smartjs-clickable",
                    style: {
                        margin: "12px 0 0 0"
                    },
                    onClick: () => {
                        if ( this.props.onSave ) {
                            let cfg = {};

                            for ( let i = 0; i < this.state.options.length; i++ ) {
                                if ( this.state.options[i].type == OptionType.BOOL ) {
                                    cfg[ `${this.props.prefix}${this.state.options[i].key}` ] = this.state.options[i].value ? "true" : "false";
                                } else {
                                    cfg[ `${this.props.prefix}${this.state.options[i].key}` ] = this.state.options[i].value;
                                }
                            }

                            this.props.onSave( cfg );
                        }
                    }
                },
                "SAVE"
            )
        );
    }

    update() {
        this.setState( {} );
    }
}