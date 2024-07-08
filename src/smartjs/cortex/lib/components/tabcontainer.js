import { Proxy } from "/smartjs/lib/proxy";
import { ReactWrapper } from "/smartjs/cortex/lib/reactwrapper";

export function TabContainer () {
    const p = Proxy();
    const w = ReactWrapper();
    let labels = [];
    let map = {};
    let index = 0;
    w.content( props => {
        return typeof map[ labels[ index ] ] != "undefined" ?
            React.createElement( "div",
                {
                    class: props.class,
                    style: props.style
                },
                React.createElement( () => map[ labels[ index ] ] )
            ) :
            React.createElement( "div",
                {
                    class: props.class,
                    style: props.style
                }
            );
    } );
    return p.final( {
        ...w.finalize(),
        addTab: ( label, content ) => {
            labels.push( label );
            map[ label ] = content;
        },
        delTab: index => {
            let label;

            labels = labels.filter( ( value, idex ) => {
                label = value.label;
                return idex != index;
            } );
            delete map[ label ];
        },
        delTabByLabel: label => {
            labels = labels.filter( value => value != label );
            delete map[ label ];
        },
        setTab: idex => index = idex,
        setTabByLabel: label => index = labels.findIndex( ( value ) => value == label ),
        nextTab: () => index = index + 1 >= labels.length ? 0 : index + 1,
        prevTab: () => index = index - 1 < 0 ? labels.length - 1 : index - 1,
        labels: () => [ ...labels ],
        current: () => index,
        currentLabel: () => labels[ index ]
    } );
}