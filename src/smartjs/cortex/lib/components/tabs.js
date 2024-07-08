import { Proxy } from "/smartjs/lib/proxy";
import { ReactWrapper } from "/smartjs/cortex/lib/reactwrapper";
import { TabContainer } from "/smartjs/cortex/lib/components/tabcontainer";

export function Tabs () {
    const p = Proxy();
    const w = ReactWrapper();
    const container = TabContainer();
    w.content( props => {
        let titles = [];

        container.labels().map( label => {
            titles.push(
                React.createElement( "span",
                    {
                        //class: label == container.currentLabel() ? "smartui-button-active" : "smartui-button",
                        class: "smartjs-clickable",
                        style: {
                            backgroundColor: label == container.currentLabel() ? "green" : "inherit"
                        },
                        onClick: () => {
                            container.setTabByLabel( label );
                            w.trigger();
                        }
                    },
                    label
                )
            );
        } );

        return React.createElement( "div", {},
            React.createElement( "div",
                {
                    style: {
                        padding: "4px 0 0 0"
                    }
                },
                ...titles
            ),
            React.createElement( container.element,
                {
                    class: props.class,
                    style: {
                        margin: "12px 0 2px 0",
                        ...props.style
                    }
                }
            )
        );
    } );
    return p.final( {
        ...w.finalize(),
        addTab: ( label, content ) => container.addTab( label, content ),
        delTab: index => container.delTab( index ),
        delTabByLabel: label => container.delTabByLabel( label ),
        setTab: index => container.setTab( index ),
        setTabByLabel: label => container.setTabByLabel( label ),
        nextTab: () => container.nextTab(),
        prevTab: () => container.prevTab()
    } );
}