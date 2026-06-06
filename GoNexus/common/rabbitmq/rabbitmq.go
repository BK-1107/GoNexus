package rabbitmq

import (
	"GoNexus/config"
	"fmt"
	"log"
	"time"

	"github.com/streadway/amqp"
)

// conn is shared by all RabbitMQ helpers in this process.
var conn *amqp.Connection

func initConn() {
	c := config.GetConfig()
	mqURL := fmt.Sprintf(
		"amqp://%s:%s@%s:%d/%s",
		c.RabbitmqUsername,
		c.RabbitmqPassword,
		c.RabbitmqHost,
		c.RabbitmqPort,
		c.RabbitmqVhost,
	)

	log.Printf("connecting to RabbitMQ at %s:%d/%s", c.RabbitmqHost, c.RabbitmqPort, c.RabbitmqVhost)

	var err error
	for i := 1; i <= 10; i++ {
		conn, err = amqp.Dial(mqURL)
		if err == nil {
			return
		}
		log.Printf("RabbitMQ connection failed (attempt %d/10): %v", i, err)
		time.Sleep(3 * time.Second)
	}

	log.Fatalf("RabbitMQ connection failed after retries: %v", err)
}

type RabbitMQ struct {
	conn     *amqp.Connection
	channel  *amqp.Channel
	Exchange string
	Key      string
}

func NewRabbitMQ(exchange string, key string) *RabbitMQ {
	return &RabbitMQ{Exchange: exchange, Key: key}
}

func (r *RabbitMQ) Destroy() {
	_ = r.channel.Close()
	_ = r.conn.Close()
}

func NewWorkRabbitMQ(queue string) *RabbitMQ {
	rabbitmq := NewRabbitMQ("", queue)

	if conn == nil {
		initConn()
	}
	rabbitmq.conn = conn

	var err error
	rabbitmq.channel, err = rabbitmq.conn.Channel()
	if err != nil {
		panic(err.Error())
	}

	return rabbitmq
}

func (r *RabbitMQ) Publish(message []byte) error {
	_, err := r.channel.QueueDeclare(r.Key, false, false, false, false, nil)
	if err != nil {
		return err
	}

	return r.channel.Publish(r.Exchange, r.Key, false, false,
		amqp.Publishing{
			ContentType: "text/plain",
			Body:        message,
		},
	)
}

func (r *RabbitMQ) Consume(handle func(msg *amqp.Delivery) error) {
	q, err := r.channel.QueueDeclare(r.Key, false, false, false, false, nil)
	if err != nil {
		panic(err)
	}

	msgs, err := r.channel.Consume(q.Name, "", true, false, false, false, nil)
	if err != nil {
		panic(err)
	}

	for msg := range msgs {
		if err := handle(&msg); err != nil {
			fmt.Println(err.Error())
		}
	}
}
