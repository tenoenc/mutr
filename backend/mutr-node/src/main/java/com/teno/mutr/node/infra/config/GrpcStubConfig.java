package com.teno.mutr.node.infra.config;

import io.grpc.health.v1.HealthGrpc;
import net.devh.boot.grpc.client.channelfactory.GrpcChannelFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GrpcStubConfig {

    @Bean
    public HealthGrpc.HealthBlockingStub healthBlockingStub(GrpcChannelFactory channelFactory) {
        return HealthGrpc.newBlockingStub(channelFactory.createChannel("mutr-ai-engine"));
    }
}
