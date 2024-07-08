import { createEnum, createLabels } from "/smartjs/lib/enums";
import { Blueprint, propInfo, PropType } from "/smartjs/lib/blueprint";

export const LogLevel = createEnum( [
    "DEBUG",
    "INFO",
    "NOTICE",
    "WARN",
    "ERROR"
] );

export const LogLevelLabels = createLabels( {
    "DEBUG": LogLevel.DEBUG,
    "INFO": LogLevel.INFO,
    "NOTICE": LogLevel.NOTICE,
    "WARN": LogLevel.WARN,
    "ERROR": LogLevel.ERROR
} );

export const FilterDesc = Blueprint( {
    level: propInfo( PropType.INTEGER, { required: false } ),
    namespaces: propInfo( PropType.ARRAY, { required: false } )
} );

export function Logger ( bus, { eventPrefix = "" } = {} ) {
	let out;
	return out = Object.freeze( {
		log: ( level, msg ) => bus.post( eventPrefix ? `${eventPrefix}.Log` : "Log", { level, msg } ),
		debug: msg => out.log( LogLevel.DEBUG, msg ),
		info: msg => out.log( LogLevel.INFO, msg ),
		notice: msg => out.log( LogLevel.NOTICE, msg ),
		warn: msg => out.log( LogLevel.WARN, msg ),
		error: msg => out.log( LogLevel.ERROR, msg )
	} );
}