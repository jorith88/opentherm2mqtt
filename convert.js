 const convertBase = function ( num ) {
    this.from = function ( baseFrom ) {
        this.to = function ( baseTo ) {
            return parseInt( num, baseFrom ).toString( baseTo );
        };
        return this;
    };
    return this;
};

// binary to decimal
module.exports.bin2dec = function ( num ) {
    return convertBase( num ).from( 2 ).to( 10 );
};

// binary to hexadecimal
module.exports.bin2hex = function ( num ) {
    return convertBase( num ).from( 2 ).to( 16 );
};

// decimal to binary
module.exports.dec2bin = function ( num ) {
    return convertBase( num ).from( 10 ).to( 2 );
};

// decimal to hexadecimal
module.exports.dec2hex = function ( num ) {
    return convertBase( num ).from( 10 ).to( 16 );
};

// hexadecimal to binary
module.exports.hex2bin = function ( num ) {
    return convertBase( num ).from( 16 ).to( 2 );
};

// hexadecimal to decimal
module.exports.hex2dec = function ( num ) {
    return convertBase( num ).from( 16 ).to( 10 );
};