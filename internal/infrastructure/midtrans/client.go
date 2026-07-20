package midtrans

import (
	"crypto/sha512"
	"fmt"

	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/coreapi"
)

// Client is a wrapper around the Midtrans Core API client.
type Client struct {
	core       coreapi.Client
	serverKey  string
	merchantID string
}

// BankTransferResult holds the result of a bank transfer charge.
type BankTransferResult struct {
	TransactionID   string
	OrderID         string
	GrossAmount     string
	TransactionTime string
	ExpiryTime      string
	VANumbers       []VANumber
	PaymentType     string
	StatusCode      string
}

// VANumber represents a Virtual Account number detail.
type VANumber struct {
	Bank     string
	VANumber string
}

// Action represents an action object (like Gopay deeplink).
type Action struct {
	Name   string
	Method string
	URL    string
}

// CoreChargeResult holds the result of a Core API charge.
type CoreChargeResult struct {
	TransactionID   string
	OrderID         string
	GrossAmount     string
	TransactionTime string
	ExpiryTime      string
	VANumbers       []VANumber
	Actions         []Action
	QRISUrl         string
	PaymentCode     string
	PaymentType     string
	StatusCode      string
}

// NewClient creates a new Midtrans Core API client.
// The environment (Sandbox or Production) is controlled by the isSandbox parameter,
// which should be set from the MIDTRANS_IS_SANDBOX environment variable.
func NewClient(serverKey, merchantID string, isSandbox bool) *Client {
	c := coreapi.Client{}
	env := midtrans.Production
	if isSandbox {
		env = midtrans.Sandbox
	}
	c.New(serverKey, env)
	return &Client{
		core:       c,
		serverKey:  serverKey,
		merchantID: merchantID,
	}
}

// ChargeBankTransfer charges a bank transfer (Virtual Account) via Midtrans Core API.
// Supported banks: "bca", "bni", "bri", "permata", "mandiri".
func (c *Client) ChargeBankTransfer(orderID string, amount int64, bank string) (*BankTransferResult, error) {
	var bankCode midtrans.Bank
	var paymentType coreapi.CoreapiPaymentType

	switch bank {
	case "mandiri":
		// Mandiri uses echannel (bill payment), not standard BankTransfer
		chargeReq := &coreapi.ChargeReq{
			PaymentType: coreapi.PaymentTypeEChannel,
			TransactionDetails: midtrans.TransactionDetails{
				OrderID:  orderID,
				GrossAmt: amount,
			},
			EChannel: &coreapi.EChannelDetail{
				BillInfo1: "Payment for Njara Subscription",
				BillInfo2: orderID,
			},
		}
		resp, err := c.core.ChargeTransaction(chargeReq)
		if err != nil {
			return nil, fmt.Errorf("midtrans mandiri charge error: %w", err)
		}
		return &BankTransferResult{
			TransactionID:   resp.TransactionID,
			OrderID:         resp.OrderID,
			GrossAmount:     resp.GrossAmount,
			TransactionTime: resp.TransactionTime,
			ExpiryTime:      resp.ExpiryTime,
			PaymentType:     string(resp.PaymentType),
			StatusCode:      resp.StatusCode,
			VANumbers: []VANumber{
				{Bank: "mandiri", VANumber: resp.BillKey},
			},
		}, nil
	case "bca":
		bankCode = midtrans.BankBca
		paymentType = coreapi.PaymentTypeBankTransfer
	case "bni":
		bankCode = midtrans.BankBni
		paymentType = coreapi.PaymentTypeBankTransfer
	case "bri":
		bankCode = midtrans.BankBri
		paymentType = coreapi.PaymentTypeBankTransfer
	case "permata":
		bankCode = midtrans.BankPermata
		paymentType = coreapi.PaymentTypeBankTransfer
	default:
		bankCode = midtrans.BankBca
		paymentType = coreapi.PaymentTypeBankTransfer
	}

	chargeReq := &coreapi.ChargeReq{
		PaymentType: paymentType,
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  orderID,
			GrossAmt: amount,
		},
		BankTransfer: &coreapi.BankTransferDetails{
			Bank: bankCode,
		},
	}

	resp, err := c.core.ChargeTransaction(chargeReq)
	if err != nil {
		return nil, fmt.Errorf("midtrans bank transfer charge error: %w", err)
	}

	result := &BankTransferResult{
		TransactionID:   resp.TransactionID,
		OrderID:         resp.OrderID,
		GrossAmount:     resp.GrossAmount,
		TransactionTime: resp.TransactionTime,
		ExpiryTime:      resp.ExpiryTime,
		PaymentType:     string(resp.PaymentType),
		StatusCode:      resp.StatusCode,
	}

	for _, va := range resp.VaNumbers {
		result.VANumbers = append(result.VANumbers, VANumber{
			Bank:     va.Bank,
			VANumber: va.VANumber,
		})
	}

	return result, nil
}

// ChargeCoreAPI is a generalized method to charge via Midtrans Core API (VA, QRIS, Gopay, OVO, CC).
func (c *Client) ChargeCoreAPI(orderID string, amount int64, paymentType string, bank string, user interface{}) (*CoreChargeResult, error) {
	var chargeReq *coreapi.ChargeReq

	switch paymentType {
	case "bank_transfer":
		// Re-use logic for Bank Transfer
		btRes, err := c.ChargeBankTransfer(orderID, amount, bank)
		if err != nil {
			return nil, err
		}
		var vaNums []VANumber
		var paymentCode string
		for _, va := range btRes.VANumbers {
			if va.Bank == "mandiri" {
				paymentCode = va.VANumber
			} else {
				vaNums = append(vaNums, VANumber{Bank: va.Bank, VANumber: va.VANumber})
			}
		}
		return &CoreChargeResult{
			TransactionID:   btRes.TransactionID,
			OrderID:         btRes.OrderID,
			GrossAmount:     btRes.GrossAmount,
			TransactionTime: btRes.TransactionTime,
			ExpiryTime:      btRes.ExpiryTime,
			VANumbers:       vaNums,
			PaymentCode:     paymentCode,
			PaymentType:     btRes.PaymentType,
			StatusCode:      btRes.StatusCode,
		}, nil

	case "qris":
		chargeReq = &coreapi.ChargeReq{
			PaymentType: coreapi.PaymentTypeQris,
			TransactionDetails: midtrans.TransactionDetails{
				OrderID:  orderID,
				GrossAmt: amount,
			},
		}

	case "gopay":
		chargeReq = &coreapi.ChargeReq{
			PaymentType: coreapi.PaymentTypeGopay,
			TransactionDetails: midtrans.TransactionDetails{
				OrderID:  orderID,
				GrossAmt: amount,
			},
		}

	case "echannel":
		chargeReq = &coreapi.ChargeReq{
			PaymentType: coreapi.PaymentTypeEChannel,
			TransactionDetails: midtrans.TransactionDetails{
				OrderID:  orderID,
				GrossAmt: amount,
			},
			EChannel: &coreapi.EChannelDetail{
				BillInfo1: "Payment for Njara",
				BillInfo2: orderID,
			},
		}

	case "credit_card":
		// NOTE: Credit Card usually requires a front-end token.
		// If used without token, it will fail unless standard setup is provided.
		// For basic implementation, we just pass the payment type.
		chargeReq = &coreapi.ChargeReq{
			PaymentType: coreapi.PaymentTypeCreditCard,
			TransactionDetails: midtrans.TransactionDetails{
				OrderID:  orderID,
				GrossAmt: amount,
			},
		}

	default:
		return nil, fmt.Errorf("unsupported payment type: %s", paymentType)
	}

	resp, err := c.core.ChargeTransaction(chargeReq)
	if err != nil {
		return nil, fmt.Errorf("midtrans core api charge error: %w", err)
	}

	result := &CoreChargeResult{
		TransactionID:   resp.TransactionID,
		OrderID:         resp.OrderID,
		GrossAmount:     resp.GrossAmount,
		TransactionTime: resp.TransactionTime,
		ExpiryTime:      resp.ExpiryTime,
		PaymentType:     string(resp.PaymentType),
		StatusCode:      resp.StatusCode,
	}

	// For QRIS
	for _, action := range resp.Actions {
		result.Actions = append(result.Actions, Action{
			Name:   action.Name,
			Method: action.Method,
			URL:    action.URL,
		})
		if action.Name == "generate-qr-code" {
			result.QRISUrl = action.URL
		}
	}

	return result, nil
}

// GetTransactionStatus queries the transaction status from Midtrans.
func (c *Client) GetTransactionStatus(orderID string) (*coreapi.TransactionStatusResponse, error) {
	resp, err := c.core.CheckTransaction(orderID)
	if err != nil {
		return nil, fmt.Errorf("midtrans check transaction error: %w", err)
	}
	return resp, nil
}

// VerifySignature verifies the Midtrans notification signature key.
// Formula: SHA512(order_id + status_code + gross_amount + server_key)
func (c *Client) VerifySignature(orderID, statusCode, grossAmount, incomingSignature string) bool {
	raw := orderID + statusCode + grossAmount + c.serverKey
	hash := sha512.Sum512([]byte(raw))
	expected := fmt.Sprintf("%x", hash)
	return expected == incomingSignature
}
