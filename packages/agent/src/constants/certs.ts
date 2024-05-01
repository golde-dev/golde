export const defaultCrt = `
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            6c:1e:60:52:e3:d5:1c:b5:f9:71:28:30:ac:54:f0:cb:78:9c:ad:2e
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: CN = tenacify.localhost
        Validity
            Not Before: Apr 30 09:07:58 2024 GMT
            Not After : Apr 25 09:07:58 2044 GMT
        Subject: CN = agent.tenacify.localhost
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                Public-Key: (2048 bit)
                Modulus:
                    00:cc:00:e2:5b:f4:85:78:9d:de:92:3a:72:0d:7d:
                    0d:d3:18:c5:9a:54:e0:e3:42:c5:25:64:03:0d:5b:
                    ae:67:eb:49:25:d2:43:77:77:2a:9e:05:8b:bb:fc:
                    46:cb:b3:eb:fe:d4:66:3b:18:38:11:5f:e8:b3:4a:
                    fa:17:ff:78:24:29:1b:a0:e6:c6:4b:b8:98:24:39:
                    cc:64:97:bf:fa:36:66:9f:bf:d5:4f:16:56:88:be:
                    85:a1:28:cd:09:6d:b8:79:c3:fe:59:90:cf:ad:ec:
                    10:22:0d:9c:72:02:a4:85:e4:03:4c:72:c6:df:38:
                    1e:1a:f9:e8:38:c0:d1:04:3a:aa:75:d2:58:79:88:
                    82:b9:03:ca:74:2a:56:49:af:fa:d2:81:1b:09:cd:
                    64:19:ad:59:c4:ad:80:ef:e5:2f:7b:73:ec:fc:19:
                    f7:c0:b2:5d:a3:a7:47:36:f0:15:e5:3a:f8:1d:f7:
                    04:d0:0b:23:de:76:e8:fb:cc:b8:8e:66:f3:8c:10:
                    30:bf:39:c5:91:ac:8b:3f:e3:23:58:26:73:39:d0:
                    2c:37:79:80:ca:fb:e0:d5:a1:25:8f:6e:c4:59:ae:
                    1d:73:0f:34:ae:b7:fa:94:2b:73:2e:55:42:4c:6a:
                    cc:f3:4b:2e:4d:b3:fc:42:e6:f9:80:08:4a:25:df:
                    fe:2f
                Exponent: 65537 (0x10001)
        X509v3 extensions:
            X509v3 Authority Key Identifier: 
                E6:70:7D:97:77:C8:69:E7:10:13:91:08:0F:CA:CB:46:94:E2:08:12
            X509v3 Basic Constraints: 
                CA:FALSE
            X509v3 Subject Alternative Name: 
                DNS:agent.tenacify.localhost
            X509v3 Key Usage: 
                Digital Signature, Non Repudiation, Key Encipherment, Data Encipherment
            X509v3 Subject Key Identifier: 
                52:92:21:B0:F5:4F:61:F2:CF:CC:7B:38:7A:81:DB:36:EB:7B:8D:B5
    Signature Algorithm: sha256WithRSAEncryption
    Signature Value:
        0e:67:c8:c8:11:40:58:7f:c7:a6:33:44:9b:0d:3d:a1:10:1e:
        a1:d8:da:9a:06:27:ea:56:dc:3e:cc:2b:f9:c8:7d:cf:1e:ee:
        4e:1c:42:f6:85:7a:29:bd:56:a8:80:61:5c:49:ac:2b:6d:4e:
        96:8d:d3:2d:8a:ec:01:03:0d:13:70:e2:b3:8d:d2:ad:a5:3c:
        2b:15:97:64:d9:43:30:90:12:58:68:41:4d:89:e4:65:0b:95:
        b9:24:2f:06:9e:d7:78:4f:76:73:87:a8:11:c2:1f:8b:8d:bd:
        4f:3d:f9:b5:74:6a:cc:46:f0:cf:18:c0:89:e2:b1:5f:e4:d2:
        d5:67:9b:70:15:c9:5b:be:4c:dc:3b:2c:54:14:7c:c2:42:ea:
        04:b8:49:6e:66:cb:27:de:94:b4:e4:f9:dc:9f:c0:cf:c5:5a:
        50:ad:ae:75:82:24:3f:96:26:ba:d4:ee:c1:f6:b0:6f:9a:1c:
        91:99:89:68:33:d0:b6:97:4b:92:bd:9b:42:ec:44:33:e5:9e:
        c4:ec:99:6a:db:68:c3:df:9e:b1:4e:d3:66:31:41:18:ab:e2:
        0a:c2:53:4c:a8:69:ef:10:0c:1a:0a:04:8b:2b:73:a1:e3:08:
        d9:30:f1:1b:ae:2b:a0:5e:a9:b3:12:55:1c:47:2d:54:10:06:
        d3:86:1e:98
-----BEGIN CERTIFICATE-----
MIIDTTCCAjWgAwIBAgIUbB5gUuPVHLX5cSgwrFTwy3icrS4wDQYJKoZIhvcNAQEL
BQAwHTEbMBkGA1UEAwwSdGVuYWNpZnkubG9jYWxob3N0MB4XDTI0MDQzMDA5MDc1
OFoXDTQ0MDQyNTA5MDc1OFowIzEhMB8GA1UEAwwYYWdlbnQudGVuYWNpZnkubG9j
YWxob3N0MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzADiW/SFeJ3e
kjpyDX0N0xjFmlTg40LFJWQDDVuuZ+tJJdJDd3cqngWLu/xGy7Pr/tRmOxg4EV/o
s0r6F/94JCkboObGS7iYJDnMZJe/+jZmn7/VTxZWiL6FoSjNCW24ecP+WZDPrewQ
Ig2ccgKkheQDTHLG3zgeGvnoOMDRBDqqddJYeYiCuQPKdCpWSa/60oEbCc1kGa1Z
xK2A7+Uve3Ps/Bn3wLJdo6dHNvAV5Tr4HfcE0Asj3nbo+8y4jmbzjBAwvznFkayL
P+MjWCZzOdAsN3mAyvvg1aElj27EWa4dcw80rrf6lCtzLlVCTGrM80suTbP8Qub5
gAhKJd/+LwIDAQABo38wfTAfBgNVHSMEGDAWgBTmcH2Xd8hp5xATkQgPystGlOII
EjAJBgNVHRMEAjAAMCMGA1UdEQQcMBqCGGFnZW50LnRlbmFjaWZ5LmxvY2FsaG9z
dDALBgNVHQ8EBAMCBPAwHQYDVR0OBBYEFFKSIbD1T2Hyz8x7OHqB2zbre421MA0G
CSqGSIb3DQEBCwUAA4IBAQAOZ8jIEUBYf8emM0SbDT2hEB6h2NqaBifqVtw+zCv5
yH3PHu5OHEL2hXopvVaogGFcSawrbU6WjdMtiuwBAw0TcOKzjdKtpTwrFZdk2UMw
kBJYaEFNieRlC5W5JC8Gntd4T3Zzh6gRwh+Ljb1PPfm1dGrMRvDPGMCJ4rFf5NLV
Z5twFclbvkzcOyxUFHzCQuoEuEluZssn3pS05Pncn8DPxVpQra51giQ/lia61O7B
9rBvmhyRmYloM9C2l0uSvZtC7EQz5Z7E7Jlq22jD356xTtNmMUEYq+IKwlNMqGnv
EAwaCgSLK3Oh4wjZMPEbriugXqmzElUcRy1UEAbThh6Y
-----END CERTIFICATE-----
`;

export const defaultKey = `
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDMAOJb9IV4nd6S
OnINfQ3TGMWaVODjQsUlZAMNW65n60kl0kN3dyqeBYu7/EbLs+v+1GY7GDgRX+iz
SvoX/3gkKRug5sZLuJgkOcxkl7/6Nmafv9VPFlaIvoWhKM0Jbbh5w/5ZkM+t7BAi
DZxyAqSF5ANMcsbfOB4a+eg4wNEEOqp10lh5iIK5A8p0KlZJr/rSgRsJzWQZrVnE
rYDv5S97c+z8GffAsl2jp0c28BXlOvgd9wTQCyPeduj7zLiOZvOMEDC/OcWRrIs/
4yNYJnM50Cw3eYDK++DVoSWPbsRZrh1zDzSut/qUK3MuVUJMaszzSy5Ns/xC5vmA
CEol3/4vAgMBAAECggEAAwV7eVjAj1BEZyC/L9XQGhqk5EvEhukmLnzNW6ClxkSr
w3W112FVzi4PRq6OV98C0Nq/MAMEUP9Gbz1eHL0FP9xtbmZIBySlQn7zOPMKIskQ
MZ1dYMTYJEGesXmRlPyGPdtxDXHT+ZqI8llPr+8pqDW2rMsc9n7168HuyJ/UKvVX
Qv8ceT/RR/NZIYa4RROVWTo2jToqXhxlR5rbQqlcW9QlKIYqFz/h7j1XiQKjaJ0n
lURODdQvl2vrMQemusWpHzHaKJtOHx7jx2xB9xYL2Ie0kyWT2uZIWWvmwmWpgFhP
Do/JWKjrA2sr4uz8tI6kV9h5R1gvpqbcmS+x7vQxEQKBgQDUfih+QLGp2x7r7rh9
4cOmYqs4qra7OGEwN62KQPt1J8IaK0WyTea60q+61LfYoOAKlnUuQCZEqDoG7idy
eKBtfqev6Xcv/MxF1ghvnrGIp8Pw2kJuwot4KlkiFrk6yFYkxU5DRf2OP51teo13
OFwHqzgDfoFXWSgKfZU+tQn+UQKBgQD1xcFj0cot8oHZmYwfaA5ag+HsipFQDse8
XHRAzx06SVA9+4bjlbrD9YlYLsgh4mB9ZyJQ+pI6eedrXSFQrH7oZCYUKj4gEOhS
qzvm5OCFvn5novQnly6KF3tIXIwLI5BObeTWFpP3Gh/sZR/PpPynug9d32iP2zyU
KAfbs6SUfwKBgFFh8AhKpsCzF2itCSPNL62t5H3ThCC4OyDIckKdGLGKBKEZKZxc
kZ3Dy2H2zmK9WpEzhrWsA/wPogm9dIY3BNpqw7Zv6CIM4/9rNdfqI3x/JGA+d2sM
P3ZKYdDYeyC0UanLl2nUiIPOgXDImx2qDDUzskREUy0tDFTYPCzEEYvBAoGBAL6o
IlXlMQpjzgeX7fOPLVNaa7Cr7f5E+P1OW4DLKslEhlMPBJ0YUkIh/+HAqNBgZKnj
j+Nx/m4Ok0/edzG2Htz4k/Ggs4D8nL1EyLtdYi9ej4CmEPGFfjzx6llAMgOSGyg8
aAEMksxmH82qxPq36qfS1ojj/qFaWaw1QaNVwJ7RAoGAIQw8w1XiJXuG56e2uVJa
yRCpMAQqokQ3iaA+J8KMTqSMuWM2k+r+BgL38cT0O4Y4G/wE/33cYP6ElODtuzvv
v1oV75X4+I5F7cS3UrANcc90VY+wpIcdWd+zwZtgRlBQYQ0nqF7fhh0Ey/Y0DVPk
/FTum2tLUYujDSDm1O9EyPU=
-----END PRIVATE KEY-----

`;
